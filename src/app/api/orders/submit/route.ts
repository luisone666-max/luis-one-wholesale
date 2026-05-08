import { NextResponse } from "next/server";
import { createServerSupabaseClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ReceivingMethod, ShippingFeePayment } from "@/lib/order-labels";

type CheckoutPayload = {
  receiverName?: string;
  receiverPhone?: string;
  receivingMethod?: ReceivingMethod;
  completeAddress?: string;
  shippingFeePayment?: ShippingFeePayment;
  orderNotes?: string;
};

type CartItemRow = {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
};

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  moq: number | null;
  active: boolean | null;
  stock_status: string | null;
  supplier_notes: string | null;
};

type PriceTierRow = {
  product_id: string | null;
  variant_id?: string | null;
  min_qty: number;
  max_qty: number | null;
  unit_price: number | string;
};

type VariantRow = {
  id: string;
  product_id: string;
  variant_name: string;
  variant_sku: string | null;
  moq: number | null;
  active: boolean | null;
  stock_status: string | null;
  supplier_notes?: never;
};

type ValidCheckoutPayload = {
  receiverName: string;
  receiverPhone: string;
  receivingMethod: ReceivingMethod;
  completeAddress: string | null;
  shippingFeePayment: ShippingFeePayment;
  orderNotes: string | null;
};

const receivingMethods: ReceivingMethod[] = ["pickup", "local_delivery", "courier_shipping", "to_be_arranged"];
const shippingFeePayments: ShippingFeePayment[] = ["freight_collect", "prepaid", "to_be_confirmed", "no_shipping_fee"];

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isUnavailableStockStatus(status: string | null | undefined) {
  return status === "Unavailable" || status === "unavailable";
}

function validateCheckoutPayload(payload: CheckoutPayload): { value: ValidCheckoutPayload } | { error: string } {
  const receiverName = clean(payload.receiverName);
  const receiverPhone = clean(payload.receiverPhone);
  const receivingMethod = payload.receivingMethod;
  const completeAddress = clean(payload.completeAddress);
  let shippingFeePayment = payload.shippingFeePayment;
  const orderNotes = clean(payload.orderNotes);

  if (!receiverName) {
    return { error: "Receiver Name is required." };
  }

  if (!receiverPhone) {
    return { error: "Receiver Phone Number is required." };
  }

  if (!receivingMethod || !receivingMethods.includes(receivingMethod)) {
    return { error: "Receiving Method is required." };
  }

  if ((receivingMethod === "local_delivery" || receivingMethod === "courier_shipping") && !completeAddress) {
    return { error: "Complete Address is required for delivery or courier shipping." };
  }

  if (receivingMethod === "pickup") {
    shippingFeePayment = "no_shipping_fee";
  } else if (receivingMethod === "courier_shipping" && !shippingFeePayment) {
    shippingFeePayment = "freight_collect";
  } else if (receivingMethod === "to_be_arranged") {
    shippingFeePayment = "to_be_confirmed";
  }

  if (!shippingFeePayment || !shippingFeePayments.includes(shippingFeePayment)) {
    return { error: "Shipping Fee Payment is required." };
  }

  if (receivingMethod === "local_delivery" && shippingFeePayment === "no_shipping_fee") {
    return { error: "Local delivery requires freight collect, prepaid, or to be confirmed shipping fee payment." };
  }

  return {
    value: {
      receiverName,
      receiverPhone,
      receivingMethod,
      completeAddress: completeAddress || null,
      shippingFeePayment,
      orderNotes: orderNotes || null,
    },
  };
}

function getShippingFeeStatus(shippingFeePayment: ShippingFeePayment) {
  if (shippingFeePayment === "freight_collect") {
    return "freight_collect";
  }

  if (shippingFeePayment === "no_shipping_fee") {
    return "no_shipping_fee";
  }

  return "to_be_confirmed";
}

function findTier(tiers: PriceTierRow[], productId: string, quantity: number) {
  return tiers.find(
    (tier) =>
      tier.product_id === productId &&
      quantity >= tier.min_qty &&
      (tier.max_qty === null || quantity <= tier.max_qty),
  );
}

function findVariantTier(tiers: PriceTierRow[], variantId: string, quantity: number) {
  return tiers.find(
    (tier) =>
      tier.variant_id === variantId &&
      quantity >= tier.min_qty &&
      (tier.max_qty === null || quantity <= tier.max_qty),
  );
}

async function generateOrderNo(admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>) {
  const year = new Date().getFullYear();
  const prefix = `LO-${year}-`;
  const { data, error } = await admin
    .from("orders")
    .select("order_no")
    .like("order_no", `${prefix}%`)
    .order("order_no", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const latest = (data?.[0] as { order_no?: string } | undefined)?.order_no ?? "";
  const latestNumber = Number(latest.replace(prefix, "")) || 0;

  return `${prefix}${String(latestNumber + 1).padStart(6, "0")}`;
}

export async function POST(request: Request) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase server credentials are not configured.", 500);
  }

  const token = getBearerToken(request);

  if (!token) {
    return jsonError("Please login before placing an order.", 401);
  }

  const {
    data: { user },
    error: userError,
  } = await (createServerSupabaseClient() ?? admin).auth.getUser(token);

  if (userError || !user) {
    return jsonError("Your login session has expired. Please login again.", 401);
  }

  const payload = (await request.json().catch(() => ({}))) as CheckoutPayload;
  const validation = validateCheckoutPayload(payload);

  if ("error" in validation) {
    return jsonError(validation.error);
  }

  const { data: customer, error: customerError } = await admin
    .from("customers")
    .select("id,auth_user_id,name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (customerError) {
    return jsonError(customerError.message, 500);
  }

  if (!customer) {
    return jsonError("Customer profile was not found. Please register again.", 404);
  }

  const customerId = (customer as { id: string }).id;
  const { data: cartData, error: cartError } = await admin
    .from("cart_items")
    .select("id,product_id,variant_id,quantity")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true });

  if (cartError) {
    return jsonError(cartError.message, 500);
  }

  const cartItems = (cartData ?? []) as CartItemRow[];

  if (!cartItems.length) {
    return jsonError("Your cart is empty. Please add products before checkout.");
  }

  const productIds = [...new Set(cartItems.map((item) => item.product_id))];
  const variantIds = [...new Set(cartItems.map((item) => item.variant_id).filter((id): id is string => Boolean(id)))];
  const [
    { data: productsData, error: productsError },
    { data: tiersData, error: tiersError },
    variantsResult,
    variantTiersResult,
  ] = await Promise.all([
    admin.from("products").select("id,sku,name,moq,active,stock_status,supplier_notes").in("id", productIds),
    admin.from("product_price_tiers").select("product_id,min_qty,max_qty,unit_price").in("product_id", productIds),
    variantIds.length
      ? admin.from("product_variants").select("id,product_id,variant_name,variant_sku,moq,active,stock_status").in("id", variantIds)
      : Promise.resolve({ data: [], error: null }),
    variantIds.length
      ? admin.from("product_variant_price_tiers").select("variant_id,min_qty,max_qty,unit_price").in("variant_id", variantIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (productsError) {
    return jsonError(productsError.message, 500);
  }

  if (tiersError) {
    return jsonError(tiersError.message, 500);
  }

  if (variantsResult.error) {
    return jsonError(variantsResult.error.message, 500);
  }

  if (variantTiersResult.error) {
    return jsonError(variantTiersResult.error.message, 500);
  }

  const productsById = new Map((productsData ?? []).map((product) => [(product as ProductRow).id, product as ProductRow]));
  const variantsById = new Map(((variantsResult.data ?? []) as VariantRow[]).map((variant) => [variant.id, variant]));
  const tiers = (tiersData ?? []) as PriceTierRow[];
  const variantTiers = (variantTiersResult.data ?? []) as PriceTierRow[];
  const orderItems = [];
  let productTotal = 0;

  for (const cartItem of cartItems) {
    const product = productsById.get(cartItem.product_id);

    if (!product || !product.active) {
      return jsonError("One or more products in your cart are no longer available.");
    }

    if (isUnavailableStockStatus(product.stock_status)) {
      return jsonError(`${product.name} is currently unavailable for direct checkout. Please contact us on Messenger so we can check stock or arrange a special order.`);
    }

    const variant = cartItem.variant_id ? variantsById.get(cartItem.variant_id) : null;

    if (cartItem.variant_id && (!variant || !variant.active || variant.product_id !== product.id)) {
      return jsonError(`${product.name}: selected variant is no longer available.`);
    }

    if (isUnavailableStockStatus(variant?.stock_status)) {
      return jsonError(`${product.name} / ${variant.variant_name} is currently unavailable for direct checkout. Please contact us on Messenger so we can check stock or arrange a special order.`);
    }

    const moq = variant?.moq ?? product.moq ?? 1;

    if (cartItem.quantity < moq) {
      return jsonError(`${product.name} minimum order quantity is ${moq} pc${moq === 1 ? "" : "s"}.`);
    }

    const variantTierRows = variant ? variantTiers.filter((tierRow) => tierRow.variant_id === variant.id) : [];
    const tier = variant && variantTierRows.length
      ? findVariantTier(variantTierRows, variant.id, cartItem.quantity)
      : findTier(tiers, product.id, cartItem.quantity);

    if (!tier) {
      return jsonError(`${variant ? `${product.name} / ${variant.variant_name}` : product.name}: Contact us for quotation.`);
    }

    const unitPrice = Number(tier.unit_price);
    const subtotal = unitPrice * cartItem.quantity;
    productTotal += subtotal;

    orderItems.push({
      product_id: product.id,
      variant_id: variant?.id ?? null,
      variant_name_snapshot: variant?.variant_name ?? null,
      variant_sku_snapshot: variant?.variant_sku ?? null,
      product_name_snapshot: product.name,
      sku_snapshot: variant?.variant_sku ?? product.sku,
      quantity: cartItem.quantity,
      unit_price_snapshot: unitPrice,
      subtotal,
      supplier_notes_snapshot: product.supplier_notes,
    });
  }

  let orderId = "";

  try {
    const orderNo = await generateOrderNo(admin);
    const checkout = validation.value;
    const { data: orderData, error: orderError } = await admin
      .from("orders")
      .insert({
        order_no: orderNo,
        customer_id: customerId,
        product_total: productTotal,
        order_status: "pending_confirmation",
        payment_status: "no_payment",
        receiver_name: checkout.receiverName,
        receiver_phone: checkout.receiverPhone,
        receiving_method: checkout.receivingMethod,
        complete_address: checkout.completeAddress,
        shipping_fee_payment_method: checkout.shippingFeePayment,
        shipping_fee_amount: null,
        shipping_fee_status: getShippingFeeStatus(checkout.shippingFeePayment),
        order_notes: checkout.orderNotes,
      })
      .select("id,order_no")
      .single();

    if (orderError || !orderData) {
      throw new Error(orderError?.message ?? "Order creation failed.");
    }

    orderId = (orderData as { id: string }).id;
    const itemsToInsert = orderItems.map((item) => ({ ...item, order_id: orderId }));
    const { error: itemsError } = await admin.from("order_items").insert(itemsToInsert);

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    const { error: clearCartError } = await admin.from("cart_items").delete().eq("customer_id", customerId);

    if (clearCartError) {
      throw new Error(clearCartError.message);
    }

    return NextResponse.json({ ok: true, orderNo: (orderData as { order_no: string }).order_no });
  } catch (error) {
    if (orderId) {
      await admin.from("orders").delete().eq("id", orderId);
    }

    return jsonError(error instanceof Error ? error.message : "Order submission failed.", 500);
  }
}
