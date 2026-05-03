import { NextResponse } from "next/server";
import { parseProductPayload, type ProductPayload } from "@/lib/admin-product-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function adminDevAccessAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.ADMIN_DEV_ACCESS === "true";
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
  if (!adminDevAccessAllowed()) {
    return jsonError("Admin API is disabled until admin authentication is added.", 403);
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

  return NextResponse.json({ ok: true, productId });
}
