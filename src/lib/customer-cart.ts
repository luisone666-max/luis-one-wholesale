"use client";

import { getCurrentCustomerSession, type CustomerProfile } from "@/lib/customer-auth";
import { isUnavailableStockStatus } from "@/lib/mock-data";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getWholesalePriceForQuantity } from "@/lib/wholesale-pricing";

type BrowserSupabaseClient = NonNullable<ReturnType<typeof createBrowserSupabaseClient>>;

type CartItemRow = {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
};

type CartProductRow = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  moq: number | null;
  image_url: string | null;
  stock_status: string | null;
};

type CartVariantRow = {
  id: string;
  product_id: string;
  variant_name: string;
  variant_sku: string | null;
  image_url: string | null;
  moq: number | null;
  stock_status: string | null;
  active: boolean | null;
};

export type CustomerCartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  sku: string;
  variantSku: string | null;
  slug: string;
  name: string;
  variantName: string | null;
  image: string;
  moq: number;
  quantity: number;
  appliedUnitPrice: number | null;
  subtotal: number | null;
  tierLabel: string | null;
  priceError?: string;
};

type CartActionResult = {
  ok: boolean;
  message: string;
};

type CartContext = { supabase: BrowserSupabaseClient; customer: CustomerProfile } | { error: string };

async function getCartContext(): Promise<CartContext> {
  const supabase = createBrowserSupabaseClient();

  if (!supabase) {
    return { error: "Supabase is not configured yet." as const };
  }

  const session = await getCurrentCustomerSession();

  if (!session.user || !session.customer) {
    return { error: "Please login or register to place order." as const };
  }

  return { supabase, customer: session.customer };
}

export async function addProductToCart(productId: string | undefined, quantity: number, variantId?: string | null): Promise<CartActionResult> {
  if (!productId) {
    return { ok: false, message: "This product is not connected to the order cart yet." };
  }

  const context = await getCartContext();

  if ("error" in context) {
    return { ok: false, message: context.error };
  }

  const { supabase, customer } = context;
  const requestedQuantity = Math.max(1, Math.floor(quantity));
  const { data: productData, error: productError } = await supabase
    .from("customer_products")
    .select("id,moq,stock_status")
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    return { ok: false, message: productError.message };
  }

  if (!productData) {
    return { ok: false, message: "This product is unavailable." };
  }

  const product = productData as { id: string; moq: number | null; stock_status: string | null };

  if (isUnavailableStockStatus(product.stock_status)) {
    return {
      ok: false,
      message: "This item is currently unavailable for direct order. Please ask on Messenger so we can check stock or arrange a special order.",
    };
  }

  let moq = product.moq ?? 1;
  const normalizedVariantId = variantId ?? null;

  const { data: variantRowsData, error: variantsError } = await supabase
    .from("product_variants")
    .select("id,moq,active,stock_status")
    .eq("product_id", productId)
    .eq("active", true);

  if (variantsError && !variantsError.message.toLowerCase().includes("product_variants")) {
    return { ok: false, message: variantsError.message };
  }

  const activeVariants = (variantRowsData ?? []) as {
    id: string;
    moq: number | null;
    active: boolean | null;
    stock_status: string | null;
  }[];

  if (activeVariants.length && !normalizedVariantId) {
    return { ok: false, message: "Please select a variant before adding this product." };
  }

  if (normalizedVariantId) {
    const variant = activeVariants.find((item) => item.id === normalizedVariantId);

    if (!variant) {
      return { ok: false, message: "Please select an available variant." };
    }

    if (isUnavailableStockStatus(variant.stock_status)) {
      return {
        ok: false,
        message: "This variant is currently unavailable for direct order. Please ask on Messenger so we can check stock or arrange a special order.",
      };
    }

    moq = variant.moq ?? 1;
  }

  const quantityToAdd = Math.max(requestedQuantity, moq);
  let existingQuery = supabase
    .from("cart_items")
    .select("id,quantity")
    .eq("customer_id", customer.id)
    .eq("product_id", productId);

  existingQuery = normalizedVariantId ? existingQuery.eq("variant_id", normalizedVariantId) : existingQuery.is("variant_id", null);

  const { data: existingData, error: existingError } = await existingQuery.maybeSingle();

  if (existingError) {
    return { ok: false, message: existingError.message };
  }

  const existing = existingData as { id: string; quantity: number } | null;
  const nextQuantity = (existing?.quantity ?? 0) + quantityToAdd;
  const pricing = await getWholesalePriceForQuantity(productId, nextQuantity, {
    supabase,
    moq,
    variantId: normalizedVariantId,
  });

  if (!pricing.ok) {
    return { ok: false, message: pricing.error };
  }

  const mutation = existing
    ? supabase.from("cart_items").update({ quantity: nextQuantity }).eq("id", existing.id).eq("customer_id", customer.id)
    : supabase.from("cart_items").insert({
        customer_id: customer.id,
        product_id: productId,
        variant_id: normalizedVariantId,
        quantity: quantityToAdd,
      });

  const { error } = await mutation;

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Product added to order list." };
}

export async function getCustomerCartItems(): Promise<{ items: CustomerCartItem[]; error?: string }> {
  const context = await getCartContext();

  if ("error" in context) {
    return { items: [], error: context.error };
  }

  const { supabase, customer } = context;
  const { data: cartRowsData, error } = await supabase
    .from("cart_items")
    .select("id,product_id,variant_id,quantity")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: true });

  if (error) {
    return { items: [], error: error.message };
  }

  const cartRows = (cartRowsData ?? []) as CartItemRow[];
  const productIds = [...new Set(cartRows.map((item) => item.product_id))];
  const variantIds = [...new Set(cartRows.map((item) => item.variant_id).filter((id): id is string => Boolean(id)))];

  if (!productIds.length) {
    return { items: [] };
  }

  const { data: productRowsData, error: productsError } = await supabase
    .from("customer_products")
    .select("id,sku,name,slug,moq,image_url,stock_status")
    .in("id", productIds);

  if (productsError) {
    return { items: [], error: productsError.message };
  }

  const productsById = new Map((productRowsData ?? []).map((product) => [(product as CartProductRow).id, product as CartProductRow]));
  const { data: variantRowsData, error: variantsError } = variantIds.length
    ? await supabase
        .from("product_variants")
        .select("id,product_id,variant_name,variant_sku,image_url,moq,stock_status,active")
        .in("id", variantIds)
    : { data: [], error: null };

  if (variantsError) {
    return { items: [], error: variantsError.message };
  }

  const variantsById = new Map((variantRowsData ?? []).map((variant) => [(variant as CartVariantRow).id, variant as CartVariantRow]));
  const items: CustomerCartItem[] = [];

  for (const cartItem of cartRows) {
    const product = productsById.get(cartItem.product_id);

    if (!product) {
      continue;
    }

    const variant = cartItem.variant_id ? variantsById.get(cartItem.variant_id) : null;
    const moq = variant?.moq ?? product.moq ?? 1;
    const unavailable = isUnavailableStockStatus(product.stock_status) || isUnavailableStockStatus(variant?.stock_status);
    const pricing = await getWholesalePriceForQuantity(product.id, cartItem.quantity, { supabase, moq, variantId: variant?.id ?? null });

    items.push({
      id: cartItem.id,
      productId: product.id,
      variantId: variant?.id ?? null,
      sku: product.sku,
      variantSku: variant?.variant_sku ?? null,
      slug: product.slug,
      name: product.name,
      variantName: variant?.variant_name ?? null,
      image: variant?.image_url || product.image_url || "/products/phone-accessories.svg",
      moq,
      quantity: cartItem.quantity,
      appliedUnitPrice: unavailable ? null : pricing.ok ? pricing.applied_unit_price : null,
      subtotal: unavailable ? null : pricing.ok ? pricing.subtotal : null,
      tierLabel: unavailable ? null : pricing.ok ? pricing.tier_label : null,
      priceError: unavailable
        ? "This item is currently unavailable for direct checkout. Please ask on Messenger."
        : pricing.ok
          ? undefined
          : pricing.error,
    });
  }

  return { items };
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<CartActionResult> {
  const context = await getCartContext();

  if ("error" in context) {
    return { ok: false, message: context.error };
  }

  const { supabase, customer } = context;
  const nextQuantity = Math.floor(quantity);

  if (nextQuantity <= 0) {
    return { ok: false, message: "Please enter a valid quantity." };
  }

  const { data: cartItemData, error: cartItemError } = await supabase
    .from("cart_items")
    .select("id,product_id,variant_id,quantity")
    .eq("id", cartItemId)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (cartItemError) {
    return { ok: false, message: cartItemError.message };
  }

  const cartItem = cartItemData as CartItemRow | null;

  if (!cartItem) {
    return { ok: false, message: "Cart item was not found." };
  }

  const { data: productData, error: productError } = await supabase
    .from("customer_products")
    .select("id,moq,stock_status")
    .eq("id", cartItem.product_id)
    .maybeSingle();

  if (productError) {
    return { ok: false, message: productError.message };
  }

  const product = productData as { id: string; moq: number | null; stock_status: string | null } | null;

  if (!product) {
    return { ok: false, message: "This product is unavailable." };
  }

  if (isUnavailableStockStatus(product.stock_status)) {
    return { ok: false, message: "This item is currently unavailable for direct checkout. Please ask on Messenger." };
  }

  let moq = product.moq ?? 1;

  if (cartItem.variant_id) {
    const { data: variantData, error: variantError } = await supabase
      .from("product_variants")
      .select("id,moq,active,stock_status")
      .eq("id", cartItem.variant_id)
      .eq("product_id", product.id)
      .maybeSingle();

    if (variantError) {
      return { ok: false, message: variantError.message };
    }

    const variant = variantData as { id: string; moq: number | null; active: boolean | null; stock_status: string | null } | null;

    if (!variant || !variant.active) {
      return { ok: false, message: "Please select an available variant." };
    }

    if (isUnavailableStockStatus(variant.stock_status)) {
      return { ok: false, message: "This variant is currently unavailable for direct checkout. Please ask on Messenger." };
    }

    moq = variant.moq ?? 1;
  }

  const pricing = await getWholesalePriceForQuantity(product.id, nextQuantity, {
    supabase,
    moq,
    variantId: cartItem.variant_id,
  });

  if (!pricing.ok) {
    return { ok: false, message: pricing.error };
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: nextQuantity })
    .eq("id", cartItemId)
    .eq("customer_id", customer.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Cart quantity updated." };
}

export async function removeCartItem(cartItemId: string): Promise<CartActionResult> {
  const context = await getCartContext();

  if ("error" in context) {
    return { ok: false, message: context.error };
  }

  const { supabase, customer } = context;
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId).eq("customer_id", customer.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Item removed from order list." };
}
