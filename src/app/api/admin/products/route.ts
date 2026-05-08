import { NextResponse } from "next/server";
import { summarizeProductPayload, writeAdminAuditLog } from "@/lib/admin-audit-log";
import { assertUniqueVariantSkus, saveProductVariants } from "@/lib/admin-product-variants";
import { parseProductPayload, type ProductPayload } from "@/lib/admin-product-validation";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { getAdminProducts, toAdminProductLookupRecords } from "@/lib/admin-products-data";
import { canManageProducts } from "@/lib/admin-role-access";
import { revalidateCatalogPages } from "@/lib/catalog-revalidate";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function GET(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "24");
  const result = await getAdminProducts({
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 24,
    search: url.searchParams.get("q") ?? "",
    categoryId: url.searchParams.get("categoryId") ?? "all",
    stockStatus: url.searchParams.get("stockStatus") ?? "all",
    activeStatus: (url.searchParams.get("activeStatus") as "all" | "active" | "hidden" | null) ?? "all",
    attention: (url.searchParams.get("attention") as "all" | "unavailable" | "low_stock" | "missing_image" | "hidden" | null) ?? "all",
  });

  if (result.error) {
    return jsonError(result.error, 500);
  }

  if (guard.admin.role === "sales" || guard.admin.role === "staff") {
    return NextResponse.json({
      ok: true,
      products: toAdminProductLookupRecords(result.products),
      categories: [],
      totalProducts: result.totalProducts,
      page: result.page,
      pageSize: result.pageSize,
      summary: result.summary,
      categoryProductCounts: result.categoryProductCounts,
    });
  }

  if (!canManageProducts(guard.admin.role)) {
    return jsonError("Only product managers or sales staff can view product data.", 403);
  }

  return NextResponse.json({
    ok: true,
    products: result.products,
    categories: result.categories,
    totalProducts: result.totalProducts,
    page: result.page,
    pageSize: result.pageSize,
    summary: result.summary,
    categoryProductCounts: result.categoryProductCounts,
  });
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

  if (!guard.admin || !canManageProducts(guard.admin.role)) {
    return jsonError("Only product managers can create products.", 403);
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
      retail_price: payload.retailPrice,
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
  if (payload.tiers.length) {
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
  }

  const variantError = await saveProductVariants(admin, productId, payload.variants);

  if (variantError) {
    await admin.from("products").delete().eq("id", productId);
    return jsonError(variantError, 500);
  }

  revalidateCatalogPages();
  await writeAdminAuditLog({
    supabase: admin,
    admin: guard.admin,
    action: "product_created",
    entityType: "product",
    entityId: productId,
    entityLabel: payload.sku,
    newData: summarizeProductPayload(payload),
  });

  return NextResponse.json({ ok: true, productId });
}
