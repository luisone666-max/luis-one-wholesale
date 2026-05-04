import { createSupabaseAdminClient } from "@/lib/supabase/server";

type CategoryRow = {
  id: string;
  name_en: string;
  slug: string;
  parent_id: string | null;
  level: number;
  active: boolean | null;
  sort_order: number | null;
};

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category_id: string | null;
  subcategory_id: string | null;
  child_category_id: string | null;
  brand: string | null;
  model: string | null;
  moq: number | null;
  retail_price: number | string | null;
  stock_status: string | null;
  lead_time: string | null;
  image_url: string | null;
  description: string | null;
  supplier_notes: string | null;
  internal_cost_notes: string | null;
  admin_notes: string | null;
  active: boolean | null;
  created_at: string | null;
};

type PriceTierRow = {
  id: string;
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
  model: string | null;
  fits: string | null;
  image_url: string | null;
  moq: number | null;
  stock_status: string | null;
  lead_time: string | null;
  active: boolean | null;
  sort_order: number | null;
};

export type AdminCategoryOption = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  active: boolean;
};

export type AdminProductTier = {
  id?: string;
  minQty: number;
  maxQty: number | null;
  unitPrice: number;
};

export type AdminProductVariant = {
  id?: string;
  name: string;
  sku: string;
  model: string;
  fits: string;
  imageUrl: string;
  moq: number;
  stockStatus: string;
  leadTime: string;
  active: boolean;
  sortOrder: number;
  tiers: AdminProductTier[];
};

export type AdminProductRecord = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  categoryId: string | null;
  subcategoryId: string | null;
  childCategoryId: string | null;
  category: string;
  subcategory: string;
  childCategory: string;
  brand: string;
  model: string;
  moq: number;
  retailPrice: number | null;
  stockStatus: string;
  leadTime: string;
  image: string;
  description: string;
  supplierNotes: string;
  internalCostNotes: string;
  adminNotes: string;
  active: boolean;
  priceRange: string;
  tiers: AdminProductTier[];
  variants: AdminProductVariant[];
  hasOrderItems: boolean;
};

export type AdminProductsResult = {
  products: AdminProductRecord[];
  categories: AdminCategoryOption[];
  error?: string;
};

function getPriceRange(tiers: AdminProductTier[]) {
  if (!tiers.length) {
    return "-";
  }

  const prices = tiers.map((tier) => tier.unitPrice);
  return `PHP ${Math.min(...prices).toLocaleString("en-US")} - PHP ${Math.max(...prices).toLocaleString("en-US")}`;
}

export async function getAdminProducts(): Promise<AdminProductsResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { products: [], categories: [], error: "Supabase admin client is not configured." };
  }

  const [productsResult, categoriesResult, tiersResult, orderItemsResult, variantsResult, variantTiersResult] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,sku,name,slug,category_id,subcategory_id,child_category_id,brand,model,moq,retail_price,stock_status,lead_time,image_url,description,supplier_notes,internal_cost_notes,admin_notes,active,created_at",
      )
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id,name_en,slug,parent_id,level,active,sort_order").order("sort_order", { ascending: true }),
    supabase.from("product_price_tiers").select("id,product_id,min_qty,max_qty,unit_price").order("min_qty", { ascending: true }),
    supabase.from("order_items").select("product_id"),
    supabase
      .from("product_variants")
      .select("id,product_id,variant_name,variant_sku,model,fits,image_url,moq,stock_status,lead_time,active,sort_order")
      .order("sort_order", { ascending: true }),
    supabase.from("product_variant_price_tiers").select("id,variant_id,min_qty,max_qty,unit_price").order("min_qty", { ascending: true }),
  ]);

  if (productsResult.error) {
    return { products: [], categories: [], error: productsResult.error.message };
  }

  if (categoriesResult.error) {
    return { products: [], categories: [], error: categoriesResult.error.message };
  }

  if (tiersResult.error) {
    return { products: [], categories: [], error: tiersResult.error.message };
  }

  if (orderItemsResult.error) {
    return { products: [], categories: [], error: orderItemsResult.error.message };
  }

  const categories = ((categoriesResult.data ?? []) as CategoryRow[]).map((category) => ({
    id: category.id,
    name: category.name_en,
    slug: category.slug,
    parentId: category.parent_id,
    level: category.level,
    active: Boolean(category.active),
  }));
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const tiersByProductId = new Map<string, AdminProductTier[]>();
  const variantsByProductId = new Map<string, AdminProductVariant[]>();
  const tiersByVariantId = new Map<string, AdminProductTier[]>();
  const productIdsWithOrders = new Set(((orderItemsResult.data ?? []) as { product_id: string | null }[])
    .map((item) => item.product_id)
    .filter((id): id is string => Boolean(id)));

  for (const tier of (tiersResult.data ?? []) as PriceTierRow[]) {
    if (!tier.product_id) {
      continue;
    }

    tiersByProductId.set(tier.product_id, [
      ...(tiersByProductId.get(tier.product_id) ?? []),
      {
        id: tier.id,
        minQty: tier.min_qty,
        maxQty: tier.max_qty,
        unitPrice: Number(tier.unit_price),
      },
    ]);
  }

  if (!variantsResult.error && !variantTiersResult.error) {
    for (const tier of (variantTiersResult.data ?? []) as PriceTierRow[]) {
      if (!tier.variant_id) {
        continue;
      }

      tiersByVariantId.set(tier.variant_id, [
        ...(tiersByVariantId.get(tier.variant_id) ?? []),
        {
          id: tier.id,
          minQty: tier.min_qty,
          maxQty: tier.max_qty,
          unitPrice: Number(tier.unit_price),
        },
      ]);
    }

    for (const variant of (variantsResult.data ?? []) as VariantRow[]) {
      variantsByProductId.set(variant.product_id, [
        ...(variantsByProductId.get(variant.product_id) ?? []),
        {
          id: variant.id,
          name: variant.variant_name,
          sku: variant.variant_sku ?? "",
          model: variant.model ?? "",
          fits: variant.fits ?? "",
          imageUrl: variant.image_url ?? "",
          moq: variant.moq ?? 1,
          stockStatus: variant.stock_status ?? "for_order",
          leadTime: variant.lead_time ?? "",
          active: Boolean(variant.active),
          sortOrder: variant.sort_order ?? 0,
          tiers: tiersByVariantId.get(variant.id) ?? [],
        },
      ]);
    }
  }

  const products = ((productsResult.data ?? []) as ProductRow[]).map((product) => {
    const tiers = tiersByProductId.get(product.id) ?? [];

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      categoryId: product.category_id,
      subcategoryId: product.subcategory_id,
      childCategoryId: product.child_category_id,
      category: product.category_id ? categoriesById.get(product.category_id)?.name ?? "" : "",
      subcategory: product.subcategory_id ? categoriesById.get(product.subcategory_id)?.name ?? "" : "",
      childCategory: product.child_category_id ? categoriesById.get(product.child_category_id)?.name ?? "" : "",
      brand: product.brand ?? "",
      model: product.model ?? "",
      moq: product.moq ?? 1,
      retailPrice: product.retail_price === null ? null : Number(product.retail_price),
      stockStatus: product.stock_status ?? "for_order",
      leadTime: product.lead_time ?? "",
      image: product.image_url ?? "/products/phone-accessories.svg",
      description: product.description ?? "",
      supplierNotes: product.supplier_notes ?? "",
      internalCostNotes: product.internal_cost_notes ?? "",
      adminNotes: product.admin_notes ?? "",
      active: Boolean(product.active),
      priceRange: getPriceRange(tiers),
      tiers,
      variants: variantsByProductId.get(product.id) ?? [],
      hasOrderItems: productIdsWithOrders.has(product.id),
    };
  });

  return { products, categories };
}
