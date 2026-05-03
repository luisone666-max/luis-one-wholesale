import type { ProductPayload, ProductVariantInput } from "@/lib/admin-product-validation";
import type { createSupabaseAdminClient } from "@/lib/supabase/server";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export async function assertUniqueVariantSkus(admin: AdminClient, payload: ProductPayload, productId?: string) {
  const skus = payload.variants.map((variant) => variant.sku).filter((sku): sku is string => Boolean(sku));
  const duplicateInPayload = skus.find((sku, index) => skus.indexOf(sku) !== index);

  if (duplicateInPayload) {
    return `Variant SKU ${duplicateInPayload} is duplicated.`;
  }

  if (!skus.length) {
    return "";
  }

  const { data, error } = await admin.from("product_variants").select("id,product_id,variant_sku").in("variant_sku", skus);

  if (error) {
    if (error.message.toLowerCase().includes("product_variants")) {
      return "";
    }

    return error.message;
  }

  const duplicate = (data ?? []).find((variant) => variant.product_id !== productId);

  return duplicate ? `Variant SKU ${duplicate.variant_sku} already exists.` : "";
}

export async function saveProductVariants(admin: AdminClient, productId: string, variants: ProductVariantInput[]) {
  const { data: existingData, error: existingError } = await admin
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  if (existingError) {
    if (existingError.message.toLowerCase().includes("product_variants")) {
      return "";
    }

    return existingError.message;
  }

  const existingIds = new Set((existingData ?? []).map((variant) => variant.id as string));
  const savedIds = new Set<string>();

  for (const variant of variants) {
    const row = {
      product_id: productId,
      variant_name: variant.name,
      variant_sku: variant.sku,
      model: variant.model,
      fits: variant.fits,
      image_url: variant.imageUrl,
      moq: variant.moq,
      stock_status: variant.stockStatus,
      lead_time: variant.leadTime,
      active: variant.active,
      sort_order: variant.sortOrder,
    };

    const saveResult =
      variant.id && existingIds.has(variant.id)
        ? await admin.from("product_variants").update(row).eq("id", variant.id).eq("product_id", productId).select("id").single()
        : await admin.from("product_variants").insert(row).select("id").single();

    if (saveResult.error || !saveResult.data) {
      return saveResult.error?.message ?? "Variant save failed.";
    }

    const variantId = (saveResult.data as { id: string }).id;
    savedIds.add(variantId);

    const { error: deleteTierError } = await admin.from("product_variant_price_tiers").delete().eq("variant_id", variantId);

    if (deleteTierError) {
      return deleteTierError.message;
    }

    if (variant.tiers.length) {
      const { error: tierError } = await admin.from("product_variant_price_tiers").insert(
        variant.tiers.map((tier) => ({
          variant_id: variantId,
          min_qty: tier.minQty,
          max_qty: tier.maxQty,
          unit_price: tier.unitPrice,
        })),
      );

      if (tierError) {
        return tierError.message;
      }
    }
  }

  const idsToDelete = [...existingIds].filter((id) => !savedIds.has(id));

  if (idsToDelete.length) {
    const { error: deleteError } = await admin.from("product_variants").delete().in("id", idsToDelete);

    if (deleteError) {
      return deleteError.message;
    }
  }

  return "";
}
