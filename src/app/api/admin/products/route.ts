import { NextResponse } from "next/server";
import { assertUniqueVariantSkus, saveProductVariants } from "@/lib/admin-product-variants";
import { parseProductPayload, type ProductPayload } from "@/lib/admin-product-validation";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

async function assertUniqueProduct(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  payload: ProductPayload,
  excludeId?: string,
) {
  const { data, error } = await admin.from("products").select("id,sku,slug").or(`sku.eq.${payload.sku},slug.eq.${payload.slug}`);

  if (error) {
    return error.message;
  }

  const duplicate = (data ?? []).find((product) => product.id !== excludeId);

  if (!duplicate) {
    return "";
  }

  return duplicate.sku === payload.sku ? "SKU already exists." : "Slug already exists.";
}

export async function POST(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const payloadResult = parseProductPayload((await request.json().catch(() => ({}))) as Record<string, unknown>);

  if ("error" in payloadResult) {
    return jsonError(payloadResult.error);
  }

  const payload = payloadResult.value;
  const uniqueError = await assertUniqueProduct(admin, payload);

  if (uniqueError) {
    return jsonError(uniqueError, 409);
  }

  const variantSkuError = await assertUniqueVariantSkus(admin, payload);

  if (variantSkuError) {
    return jsonError(variantSkuError, 409);
  }

  const { data: product, error: productError } = await admin
    .from("products")
    .insert({
      sku: payload.sku,
      name: payload.name,
      slug: payload.slug,
      category_id: payload.categoryId,
      subcategory_id: payload.subcategoryId,
      child_category_id: payload.childCategoryId,
      brand: payload.brand,
      model: payload.model,
      moq: payload.moq,
      stock_status: payload.stockStatus,
      lead_time: payload.leadTime,
      image_url: payload.imageUrl,
      description: payload.description,
      supplier_notes: payload.supplierNotes,
      internal_cost_notes: payload.internalCostNotes,
      admin_notes: payload.adminNotes,
      active: payload.active,
    })
    .select("id")
    .single();

  if (productError || !product) {
    return jsonError(productError?.message ?? "Product creation failed.", 500);
  }

  const productId = (product as { id: string }).id;
  const { error: tiersError } = await admin.from("product_price_tiers").insert(
    payload.tiers.map((tier) => ({
      product_id: productId,
      min_qty: tier.minQty,
      max_qty: tier.maxQty,
      unit_price: tier.unitPrice,
    })),
  );

  if (tiersError) {
    await admin.from("products").delete().eq("id", productId);
    return jsonError(tiersError.message, 500);
  }

  const variantError = await saveProductVariants(admin, productId, payload.variants);

  if (variantError) {
    await admin.from("products").delete().eq("id", productId);
    return jsonError(variantError, 500);
  }

  return NextResponse.json({ ok: true, productId });
}
