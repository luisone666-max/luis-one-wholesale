import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type PriceTierRow = {
  min_qty: number;
  max_qty: number | null;
  unit_price: number | string;
};

type ProductMoqRow = {
  moq: number | null;
};

export type WholesalePriceResult =
  | {
      ok: true;
      applied_unit_price: number;
      subtotal: number;
      tier_label: string;
    }
  | {
      ok: false;
      error: string;
      contactForQuotation?: boolean;
    };

export function formatPhp(value: number) {
  return `₱${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function getTierLabel(tier: PriceTierRow) {
  return tier.max_qty === null ? `${tier.min_qty}+ pcs` : `${tier.min_qty}-${tier.max_qty} pcs`;
}

export async function getWholesalePriceForQuantity(
  productId: string,
  quantity: number,
  options?: { supabase?: SupabaseClient; moq?: number },
): Promise<WholesalePriceResult> {
  const supabase = options?.supabase ?? createBrowserSupabaseClient();

  if (!supabase) {
    return { ok: false, error: "Supabase is not configured yet." };
  }

  const normalizedQuantity = Math.floor(quantity);

  if (!productId || normalizedQuantity <= 0) {
    return { ok: false, error: "Please enter a valid quantity." };
  }

  let moq = options?.moq;

  if (moq === undefined) {
    const { data, error } = await supabase.from("customer_products").select("moq").eq("id", productId).maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }

    moq = ((data as ProductMoqRow | null)?.moq ?? 1);
  }

  if (normalizedQuantity < moq) {
    return { ok: false, error: `Minimum order quantity is ${moq} pc${moq === 1 ? "" : "s"}.` };
  }

  const { data: tierRows, error } = await supabase
    .from("product_price_tiers")
    .select("min_qty,max_qty,unit_price")
    .eq("product_id", productId)
    .order("min_qty", { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  const tiers = (tierRows ?? []) as PriceTierRow[];
  const tier = tiers.find(
    (item) => normalizedQuantity >= item.min_qty && (item.max_qty === null || normalizedQuantity <= item.max_qty),
  );

  if (!tier) {
    return { ok: false, error: "Contact us for quotation.", contactForQuotation: true };
  }

  const appliedUnitPrice = Number(tier.unit_price);

  return {
    ok: true,
    applied_unit_price: appliedUnitPrice,
    subtotal: appliedUnitPrice * normalizedQuantity,
    tier_label: getTierLabel(tier),
  };
}
