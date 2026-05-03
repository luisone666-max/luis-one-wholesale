import { NextResponse } from "next/server";
import { parseProductPayload, type ProductPayload } from "@/lib/admin-product-validation";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

async function assertUniqueProduct(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  payload: ProductPayload,
  excludeId: string,
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const { id } = await params;
  const rawPayload = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (rawPayload.mode === "visibility") {
    const { error } = await admin.from("products").update({ active: Boolean(rawPayload.active) }).eq("id", id);

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ ok: true });
  }

  const payloadResult = parseProductPayload(rawPayload);

  if ("error" in payloadResult) {
    return jsonError(payloadResult.error);
  }

  const payload = payloadResult.value;
  const uniqueError = await assertUniqueProduct(admin, payload, id);

  if (uniqueError) {
    return jsonError(uniqueError, 409);
  }

  const { error: productError } = await admin
    .from("products")
    .update({
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
    .eq("id", id);

  if (productError) {
    return jsonError(productError.message, 500);
  }

  const { error: deleteTiersError } = await admin.from("product_price_tiers").delete().eq("product_id", id);

  if (deleteTiersError) {
    return jsonError(deleteTiersError.message, 500);
  }

  const { error: tiersError } = await admin.from("product_price_tiers").insert(
    payload.tiers.map((tier) => ({
      product_id: id,
      min_qty: tier.minQty,
      max_qty: tier.maxQty,
      unit_price: tier.unitPrice,
    })),
  );

  if (tiersError) {
    return jsonError(tiersError.message, 500);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const { id } = await params;
  const { count, error: countError } = await admin
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  if (countError) {
    return jsonError(countError.message, 500);
  }

  if ((count ?? 0) > 0) {
    return jsonError("This product has order history. Please hide the product instead of deleting it.", 409);
  }

  const { error } = await admin.from("products").delete().eq("id", id);

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ ok: true });
}
