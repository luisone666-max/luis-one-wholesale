import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

async function uniqueValue(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  column: "sku" | "slug" | "variant_sku",
  base: string,
) {
  for (let index = 1; index < 100; index += 1) {
    const candidate = index === 1 ? `${base}-copy` : `${base}-copy-${index}`;
    const table = column === "variant_sku" ? "product_variants" : "products";
    const { data, error } = await admin.from(table).select("id").eq(column, candidate).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return candidate;
    }
  }

  throw new Error(`Could not create unique ${column}.`);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const { id } = await params;
  const { data: product, error: productError } = await admin.from("products").select("*").eq("id", id).maybeSingle();

  if (productError) {
    return jsonError(productError.message, 500);
  }

  if (!product) {
    return jsonError("Product was not found.", 404);
  }

  const { data: tiers, error: tiersError } = await admin
    .from("product_price_tiers")
    .select("min_qty,max_qty,unit_price")
    .eq("product_id", id)
    .order("min_qty", { ascending: true });

  if (tiersError) {
    return jsonError(tiersError.message, 500);
  }

  const { data: variants, error: variantsError } = await admin
    .from("product_variants")
    .select("*")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  if (variantsError && !variantsError.message.toLowerCase().includes("product_variants")) {
    return jsonError(variantsError.message, 500);
  }

  const variantRows = (variants ?? []) as Record<string, unknown>[];
  const variantIds = variantRows.map((variant) => String(variant.id));
  const variantTiersResult = variantIds.length
    ? await admin.from("product_variant_price_tiers").select("variant_id,min_qty,max_qty,unit_price").in("variant_id", variantIds)
    : { data: [], error: null };

  if (variantTiersResult.error) {
    return jsonError(variantTiersResult.error.message, 500);
  }

  try {
    const row = product as Record<string, unknown>;
    const sku = await uniqueValue(admin, "sku", String(row.sku));
    const slug = await uniqueValue(admin, "slug", String(row.slug));
    const { data: duplicated, error: duplicateError } = await admin
      .from("products")
      .insert({
        sku,
        name: `${String(row.name)} Copy`,
        slug,
        category_id: row.category_id,
        subcategory_id: row.subcategory_id,
        child_category_id: row.child_category_id,
        brand: row.brand,
        model: row.model,
        moq: row.moq,
        stock_status: row.stock_status,
        lead_time: row.lead_time,
        image_url: row.image_url,
        description: row.description,
        supplier_notes: row.supplier_notes,
        internal_cost_notes: row.internal_cost_notes,
        admin_notes: row.admin_notes,
        active: false,
      })
      .select("id")
      .single();

    if (duplicateError || !duplicated) {
      return jsonError(duplicateError?.message ?? "Duplicate product failed.", 500);
    }

    const productId = (duplicated as { id: string }).id;

    if (tiers?.length) {
      const { error: copyTiersError } = await admin.from("product_price_tiers").insert(
        tiers.map((tier) => ({
          product_id: productId,
          min_qty: tier.min_qty,
          max_qty: tier.max_qty,
          unit_price: tier.unit_price,
        })),
      );

      if (copyTiersError) {
        await admin.from("products").delete().eq("id", productId);
        return jsonError(copyTiersError.message, 500);
      }
    }

    for (const variant of variantRows) {
      const variantSku = variant.variant_sku ? await uniqueValue(admin, "variant_sku", String(variant.variant_sku)) : null;
      const { data: duplicatedVariant, error: duplicateVariantError } = await admin
        .from("product_variants")
        .insert({
          product_id: productId,
          variant_name: `${String(variant.variant_name)} Copy`,
          variant_sku: variantSku,
          model: variant.model,
          fits: variant.fits,
          image_url: variant.image_url,
          moq: variant.moq,
          stock_status: variant.stock_status,
          lead_time: variant.lead_time,
          active: false,
          sort_order: variant.sort_order,
        })
        .select("id")
        .single();

      if (duplicateVariantError || !duplicatedVariant) {
        await admin.from("products").delete().eq("id", productId);
        return jsonError(duplicateVariantError?.message ?? "Duplicate variant failed.", 500);
      }

      const newVariantId = (duplicatedVariant as { id: string }).id;
      const tiersForVariant = ((variantTiersResult.data ?? []) as Record<string, unknown>[]).filter(
        (tier) => tier.variant_id === variant.id,
      );

      if (tiersForVariant.length) {
        const { error: variantTierError } = await admin.from("product_variant_price_tiers").insert(
          tiersForVariant.map((tier) => ({
            variant_id: newVariantId,
            min_qty: tier.min_qty,
            max_qty: tier.max_qty,
            unit_price: tier.unit_price,
          })),
        );

        if (variantTierError) {
          await admin.from("products").delete().eq("id", productId);
          return jsonError(variantTierError.message, 500);
        }
      }
    }

    return NextResponse.json({ ok: true, productId });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Duplicate product failed.", 500);
  }
}
