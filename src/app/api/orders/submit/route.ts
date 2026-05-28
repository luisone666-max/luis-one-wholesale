import { NextResponse } from "next/server";
import { createServerSupabaseClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ReceivingMethod, ShippingFeePayment } from "@/lib/order-labels";
import {
  buildCompleteDeliveryAddress,
  estimateCodShippingFee,
  getShippingQuoteZone,
  normalizeAddressPart,
  type CheckoutAddressDraft,
} from "@/lib/philippines-addresses";
import { isMissingCustomerDeliveryAddressesTableError } from "@/lib/customer-delivery-addresses";

type DeliveryArrangement = "seller_books_lalamove" | "customer_books_lalamove";

type CheckoutPayload = {
  receiverName?: string;
  receiverPhone?: string;
  receivingMethod?: ReceivingMethod;
  completeAddress?: string;
  shippingFeePayment?: ShippingFeePayment;
  deliveryProvince?: string;
  deliveryCity?: string;
  deliveryBarangay?: string;
  deliveryStreetAddress?: string;
  deliveryLandmark?: string;
  deliveryNotes?: string;
  locationLatitude?: number | string | null;
  locationLongitude?: number | string | null;
  locationAccuracyM?: number | string | null;
  saveAsDefaultAddress?: boolean;
  deliveryArrangement?: DeliveryArrangement | string | null;
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
  deliveryProvince: string | null;
  deliveryCity: string | null;
  deliveryBarangay: string | null;
  deliveryStreetAddress: string | null;
  deliveryLandmark: string | null;
  deliveryNotes: string | null;
  locationLatitude: number | null;
  locationLongitude: number | null;
  locationAccuracyM: number | null;
  saveAsDefaultAddress: boolean;
  deliveryArrangement: DeliveryArrangement | null;
  orderNotes: string | null;
};

const receivingMethods: ReceivingMethod[] = ["pickup", "local_delivery", "courier_shipping"];
const shippingFeePayments: ShippingFeePayment[] = ["freight_collect", "prepaid", "cod_included", "to_be_confirmed", "no_shipping_fee"];

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

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeDeliveryArrangement(receivingMethod: ReceivingMethod | undefined, value: unknown): DeliveryArrangement | null {
  if (receivingMethod !== "local_delivery") {
    return null;
  }

  return value === "customer_books_lalamove" ? "customer_books_lalamove" : "seller_books_lalamove";
}

function getDeliveryArrangementNote(deliveryArrangement: DeliveryArrangement | null) {
  if (deliveryArrangement === "customer_books_lalamove") {
    return "Lalamove arrangement: Customer will book and pay their own Lalamove rider after stock and pickup readiness are confirmed.";
  }

  if (deliveryArrangement === "seller_books_lalamove") {
    return "Lalamove arrangement: Luis One will manually book Lalamove after stock is confirmed. No automatic Lalamove API booking is created.";
  }

  return "";
}

function appendDeliveryArrangementNote(orderNotes: string | null, deliveryArrangement: DeliveryArrangement | null) {
  const arrangementNote = getDeliveryArrangementNote(deliveryArrangement);
  return [arrangementNote, orderNotes].filter(Boolean).join("\n") || null;
}

function isMissingStructuredOrderColumnError(error: { message?: string; code?: string; details?: string }) {
  const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

  return (
    (message.includes("delivery_") || message.includes("cod_amount") || message.includes("shipping_quote_")) &&
    (message.includes("schema cache") || message.includes("could not find"))
  );
}

function isUnavailableStockStatus(status: string | null | undefined) {
  const normalized = (status ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");

  return ["unavailable", "outofstock", "soldout", "notavailable"].includes(normalized);
}

function validateCheckoutPayload(payload: CheckoutPayload): { value: ValidCheckoutPayload } | { error: string } {
  const receiverName = clean(payload.receiverName);
  const receiverPhone = clean(payload.receiverPhone);
  const receivingMethod = payload.receivingMethod;
  const addressDraft: CheckoutAddressDraft = {
    landmark: clean(payload.deliveryLandmark),
    streetAddress: clean(payload.deliveryStreetAddress),
    barangay: normalizeAddressPart(clean(payload.deliveryBarangay)),
    city: normalizeAddressPart(clean(payload.deliveryCity)),
    province: normalizeAddressPart(clean(payload.deliveryProvince)),
    notes: clean(payload.deliveryNotes),
  };
  const structuredAddress = buildCompleteDeliveryAddress(addressDraft);
  const completeAddress = clean(payload.completeAddress) || structuredAddress;
  let shippingFeePayment = payload.shippingFeePayment;
  const orderNotes = clean(payload.orderNotes);
  const deliveryArrangement = normalizeDeliveryArrangement(receivingMethod, payload.deliveryArrangement);
  const addressRequired = receivingMethod === "courier_shipping" || (receivingMethod === "local_delivery" && deliveryArrangement !== "customer_books_lalamove");
  const locationLatitude = optionalNumber(payload.locationLatitude);
  const locationLongitude = optionalNumber(payload.locationLongitude);
  const locationAccuracyM = optionalNumber(payload.locationAccuracyM);

  if (!receiverName) {
    return { error: "Receiver Name is required." };
  }

  if (!receiverPhone) {
    return { error: "Receiver Phone Number is required." };
  }

  if (!receivingMethod || !receivingMethods.includes(receivingMethod)) {
    return { error: "Receiving Method is required." };
  }

  if (addressRequired && (!addressDraft.province || !addressDraft.city || !addressDraft.barangay || !addressDraft.streetAddress)) {
    return { error: "Province, City / District, Barangay, and Street Address are required for delivery." };
  }

  if (addressRequired && !completeAddress) {
    return { error: "Complete Address is required for delivery." };
  }

  if (receivingMethod === "pickup") {
    shippingFeePayment = "no_shipping_fee";
  } else if (receivingMethod === "courier_shipping" && !shippingFeePayment) {
    shippingFeePayment = "cod_included";
  } else if (receivingMethod === "local_delivery") {
    shippingFeePayment = "to_be_confirmed";
  }

  if (!shippingFeePayment || !shippingFeePayments.includes(shippingFeePayment)) {
    return { error: "Shipping Fee Payment is required." };
  }

  if (receivingMethod === "courier_shipping" && !["cod_included", "to_be_confirmed"].includes(shippingFeePayment)) {
    return { error: "J&T Express COD requires COD included or to be confirmed shipping fee payment." };
  }

  if (receivingMethod === "courier_shipping" && shippingFeePayment === "cod_included" && estimateCodShippingFee(addressDraft.province, 1) === null) {
    return { error: "Please choose a supported province or use to be confirmed shipping for this J&T Express COD order." };
  }

  if (receivingMethod === "local_delivery" && shippingFeePayment !== "to_be_confirmed") {
    return { error: "Lalamove orders are manually arranged or booked by the customer." };
  }

  return {
    value: {
      receiverName,
      receiverPhone,
      receivingMethod,
      completeAddress: completeAddress || null,
      shippingFeePayment,
      deliveryProvince: addressDraft.province || null,
      deliveryCity: addressDraft.city || null,
      deliveryBarangay: addressDraft.barangay || null,
      deliveryStreetAddress: addressDraft.streetAddress || null,
      deliveryLandmark: addressDraft.landmark || null,
      deliveryNotes: addressDraft.notes || null,
      locationLatitude,
      locationLongitude,
      locationAccuracyM,
      saveAsDefaultAddress: payload.saveAsDefaultAddress !== false,
      deliveryArrangement,
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

  if (shippingFeePayment === "cod_included") {
    return "cod_included";
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

async function saveDefaultDeliveryAddress({
  admin,
  customerId,
  checkout,
}: {
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
  customerId: string;
  checkout: ValidCheckoutPayload;
}) {
  if (!checkout.saveAsDefaultAddress || !checkout.deliveryProvince || !checkout.deliveryCity || !checkout.deliveryBarangay || !checkout.deliveryStreetAddress) {
    return;
  }

  const addressData = {
    customer_id: customerId,
    label: "Default delivery address",
    receiver_name: checkout.receiverName,
    receiver_phone: checkout.receiverPhone,
    delivery_province: checkout.deliveryProvince,
    delivery_city: checkout.deliveryCity,
    delivery_barangay: checkout.deliveryBarangay,
    delivery_street_address: checkout.deliveryStreetAddress,
    delivery_landmark: checkout.deliveryLandmark,
    delivery_notes: checkout.deliveryNotes,
    complete_address: checkout.completeAddress ?? "",
    latitude: checkout.locationLatitude,
    longitude: checkout.locationLongitude,
    geolocation_accuracy_m: checkout.locationAccuracyM,
    is_default: true,
  };

  const { data: existingAddress, error: existingAddressError } = await admin
    .from("customer_delivery_addresses")
    .select("id")
    .eq("customer_id", customerId)
    .eq("is_default", true)
    .maybeSingle();

  if (existingAddressError) {
    if (!isMissingCustomerDeliveryAddressesTableError(existingAddressError)) {
      console.error("Default delivery address lookup failed:", existingAddressError.message);
    }

    return;
  }

  const result = existingAddress
    ? await admin.from("customer_delivery_addresses").update(addressData).eq("id", (existingAddress as { id: string }).id)
    : await admin.from("customer_delivery_addresses").insert(addressData);

  if (result.error && !isMissingCustomerDeliveryAddressesTableError(result.error)) {
    console.error("Default delivery address save failed:", result.error.message);
  }
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
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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

    if (variant && isUnavailableStockStatus(variant.stock_status)) {
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
    const estimatedShippingFee =
      checkout.shippingFeePayment === "cod_included" && checkout.receivingMethod === "courier_shipping"
        ? estimateCodShippingFee(checkout.deliveryProvince ?? "", Math.max(1, itemCount))
        : null;
    const shippingFeeAmount = checkout.shippingFeePayment === "cod_included" ? estimatedShippingFee : null;
    const codAmount = productTotal + Number(shippingFeeAmount ?? 0);
    const baseOrderInsert = {
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
      shipping_fee_amount: shippingFeeAmount,
      shipping_fee_status: getShippingFeeStatus(checkout.shippingFeePayment),
      order_notes: appendDeliveryArrangementNote(checkout.orderNotes, checkout.deliveryArrangement),
    };
    const structuredOrderInsert = {
      ...baseOrderInsert,
      delivery_province: checkout.deliveryProvince,
      delivery_city: checkout.deliveryCity,
      delivery_barangay: checkout.deliveryBarangay,
      delivery_street_address: checkout.deliveryStreetAddress,
      delivery_landmark: checkout.deliveryLandmark,
      delivery_notes: checkout.deliveryNotes,
      delivery_latitude: checkout.locationLatitude,
      delivery_longitude: checkout.locationLongitude,
      delivery_geolocation_accuracy_m: checkout.locationAccuracyM,
      shipping_quote_provider: checkout.shippingFeePayment === "cod_included" ? "manual_cod_estimate" : null,
      shipping_quote_zone: checkout.shippingFeePayment === "cod_included" ? getShippingQuoteZone(checkout.deliveryProvince ?? "") : null,
      cod_amount: codAmount,
    };
    let orderResult = await admin
      .from("orders")
      .insert(structuredOrderInsert)
      .select("id,order_no")
      .single();

    if (orderResult.error && isMissingStructuredOrderColumnError(orderResult.error)) {
      orderResult = await admin.from("orders").insert(baseOrderInsert).select("id,order_no").single();
    }

    const { data: orderData, error: orderError } = orderResult;

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

    await saveDefaultDeliveryAddress({ admin, customerId, checkout });

    return NextResponse.json({ ok: true, orderNo: (orderData as { order_no: string }).order_no });
  } catch (error) {
    if (orderId) {
      await admin.from("orders").delete().eq("id", orderId);
    }

    return jsonError(error instanceof Error ? error.message : "Order submission failed.", 500);
  }
}
