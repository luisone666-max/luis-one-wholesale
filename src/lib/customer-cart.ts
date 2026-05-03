"use client";

import { getCurrentCustomerSession, type CustomerProfile } from "@/lib/customer-auth";
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
};

export type CustomerCartItem = {
  id: string;
  productId: string;
  sku: string;
  slug: string;
  name: string;
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

export async function addProductToCart(productId: string | undefined, quantity: number): Promise<CartActionResult> {
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
    .select("id,moq")
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    return { ok: false, message: productError.message };
  }

  if (!productData) {
    return { ok: false, message: "This product is unavailable." };
  }

  const product = productData as { id: string; moq: number | null };
  const quantityToAdd = Math.max(requestedQuantity, product.moq ?? 1);
  const { data: existingData, error: existingError } = await supabase
    .from("cart_items")
    .select("id,quantity")
    .eq("customer_id", customer.id)
    .eq("product_id", productId)
    .is("variant_id", null)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: existingError.message };
  }

  const existing = existingData as { id: string; quantity: number } | null;
  const nextQuantity = (existing?.quantity ?? 0) + quantityToAdd;
  const pricing = await getWholesalePriceForQuantity(productId, nextQuantity, {
    supabase,
    moq: product.moq ?? 1,
  });

  if (!pricing.ok) {
    return { ok: false, message: pricing.error };
  }

  const mutation = existing
    ? supabase.from("cart_items").update({ quantity: nextQuantity }).eq("id", existing.id).eq("customer_id", customer.id)
    : supabase.from("cart_items").insert({
        customer_id: customer.id,
        product_id: productId,
        variant_id: null,
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

  if (!productIds.length) {
    return { items: [] };
  }

  const { data: productRowsData, error: productsError } = await supabase
    .from("customer_products")
    .select("id,sku,name,slug,moq,image_url")
    .in("id", productIds);

  if (productsError) {
    return { items: [], error: productsError.message };
  }

  const productsById = new Map((productRowsData ?? []).map((product) => [(product as CartProductRow).id, product as CartProductRow]));
  const items: CustomerCartItem[] = [];

  for (const cartItem of cartRows) {
    const product = productsById.get(cartItem.product_id);

    if (!product) {
      continue;
    }

    const moq = product.moq ?? 1;
    const pricing = await getWholesalePriceForQuantity(product.id, cartItem.quantity, { supabase, moq });

    items.push({
      id: cartItem.id,
      productId: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      image: product.image_url ?? "/products/phone-accessories.svg",
      moq,
      quantity: cartItem.quantity,
      appliedUnitPrice: pricing.ok ? pricing.applied_unit_price : null,
      subtotal: pricing.ok ? pricing.subtotal : null,
      tierLabel: pricing.ok ? pricing.tier_label : null,
      priceError: pricing.ok ? undefined : pricing.error,
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
    .select("id,product_id,quantity")
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
    .select("id,moq")
    .eq("id", cartItem.product_id)
    .maybeSingle();

  if (productError) {
    return { ok: false, message: productError.message };
  }

  const product = productData as { id: string; moq: number | null } | null;

  if (!product) {
    return { ok: false, message: "This product is unavailable." };
  }

  const pricing = await getWholesalePriceForQuantity(product.id, nextQuantity, {
    supabase,
    moq: product.moq ?? 1,
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
