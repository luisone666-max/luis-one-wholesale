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

export type AdminProductLookupRecord = Pick<
  AdminProductRecord,
  | "id"
  | "sku"
  | "name"
  | "slug"
  | "category"
  | "subcategory"
  | "childCategory"
  | "brand"
  | "model"
  | "moq"
  | "retailPrice"
  | "stockStatus"
  | "leadTime"
  | "image"
  | "priceRange"
  | "tiers"
  | "variants"
>;

export type AdminProductsSummary = {
  all: number;
  unavailable: number;
  lowStock: number;
  missingImage: number;
  hidden: number;
};

export type AdminProductsQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  stockStatus?: string;
  activeStatus?: "all" | "active" | "hidden";
  attention?: "all" | "unavailable" | "low_stock" | "missing_image" | "hidden";
};

export type AdminProductsResult = {
  products: AdminProductRecord[];
  categories: AdminCategoryOption[];
  totalProducts: number;
  page: number;
  pageSize: number;
  summary: AdminProductsSummary;
  categoryProductCounts: Record<string, number>;
  error?: string;
};

function getPriceRange(tiers: AdminProductTier[]) {
  if (!tiers.length) {
    return "-";
  }

  const prices = tiers.map((tier) => tier.unitPrice);
  return `PHP ${Math.min(...prices).toLocaleString("en-US")} - PHP ${Math.max(...prices).toLocaleString("en-US")}`;
}

export function toAdminProductLookupRecords(products: AdminProductRecord[]): AdminProductLookupRecord[] {
  return products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    category: product.category,
    subcategory: product.subcategory,
    childCategory: product.childCategory,
    brand: product.brand,
    model: product.model,
    moq: product.moq,
    retailPrice: product.retailPrice,
    stockStatus: product.stockStatus,
    leadTime: product.leadTime,
    image: product.image,
    priceRange: product.priceRange,
    tiers: product.tiers,
    variants: product.variants,
  }));
}

const emptyAdminProductsSummary: AdminProductsSummary = {
  all: 0,
  unavailable: 0,
  lowStock: 0,
  missingImage: 0,
  hidden: 0,
};

function emptyAdminProductsResult(error?: string): AdminProductsResult {
  return {
    products: [],
    categories: [],
    totalProducts: 0,
    page: 1,
    pageSize: 24,
    summary: emptyAdminProductsSummary,
    categoryProductCounts: {},
    error,
  };
}

function normalizeAdminProductSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/\bbreaks?\b/g, "brake")
    .replace(/\btop\s*box\b/g, "topbox")
    .replace(/\bkey\s*set\b/g, "keyset")
    .replace(/\bn\s*max\b/g, "nmax")
    .replace(/\baerox\s*155\b/g, "aerox155")
    .replace(/\bhonda\s*click\b/g, "click")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/([a-z])([0-9])/g, "$1 $2")
    .replace(/([0-9])([a-z])/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function productRowMatchesSearch(product: ProductRow, variants: VariantRow[], categoriesById: Map<string, AdminCategoryOption>, query: string) {
  const words = normalizeAdminProductSearch(query)
    .split(" ")
    .filter((word) => word.length > 1);

  if (!words.length) {
    return true;
  }

  const categoryNames = [product.category_id, product.subcategory_id, product.child_category_id]
    .map((id) => (id ? categoriesById.get(id)?.name : ""))
    .filter(Boolean)
    .join(" ");
  const variantText = variants.map((variant) => [variant.variant_name, variant.variant_sku, variant.model, variant.fits, variant.stock_status].filter(Boolean).join(" ")).join(" ");
  const searchable = normalizeAdminProductSearch(
    [
      product.sku,
      product.name,
      product.slug,
      categoryNames,
      product.brand,
      product.model,
      product.stock_status,
      product.lead_time,
      product.description,
      variantText,
    ].join(" "),
  );
  const compactSearchable = searchable.replace(/\s+/g, "");
  const compactQuery = words.join("");

  return words.every((word) => searchable.includes(word) || compactSearchable.includes(word)) || compactSearchable.includes(compactQuery);
}

function productRowHasStockStatus(product: ProductRow, variants: VariantRow[], status: string) {
  return product.stock_status === status || variants.some((variant) => variant.stock_status === status);
}

function productRowNeedsImage(product: ProductRow, variants: VariantRow[]) {
  const image = product.image_url ?? "";
  return !image || image.includes("/products/phone-accessories.svg") || image.includes("/brand/luis-one-logo.jpg") || variants.some((variant) => !variant.image_url);
}

function computeAdminProductsSummary(products: ProductRow[], variantsByProductId: Map<string, VariantRow[]>): AdminProductsSummary {
  return {
    all: products.length,
    unavailable: products.filter((product) => productRowHasStockStatus(product, variantsByProductId.get(product.id) ?? [], "unavailable")).length,
    lowStock: products.filter((product) => productRowHasStockStatus(product, variantsByProductId.get(product.id) ?? [], "low_stock")).length,
    missingImage: products.filter((product) => productRowNeedsImage(product, variantsByProductId.get(product.id) ?? [])).length,
    hidden: products.filter((product) => !product.active).length,
  };
}

function computeCategoryProductCounts(products: ProductRow[]) {
  const counts: Record<string, number> = {};

  for (const product of products) {
    for (const categoryId of [product.category_id, product.subcategory_id, product.child_category_id]) {
      if (categoryId) {
        counts[categoryId] = (counts[categoryId] ?? 0) + 1;
      }
    }
  }

  return counts;
}

export async function getAdminProducts(query: AdminProductsQuery = {}): Promise<AdminProductsResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return emptyAdminProductsResult("Supabase admin client is not configured.");
  }

  const pageSize = Math.min(Math.max(1, Math.floor(query.pageSize ?? 24)), 96);
  const requestedPage = Math.max(1, Math.floor(query.page ?? 1));
  const [productsResult, categoriesResult, variantsResult] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,sku,name,slug,category_id,subcategory_id,child_category_id,brand,model,moq,retail_price,stock_status,lead_time,image_url,description,supplier_notes,internal_cost_notes,admin_notes,active,created_at",
      )
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id,name_en,slug,parent_id,level,active,sort_order").order("sort_order", { ascending: true }),
    supabase
      .from("product_variants")
      .select("id,product_id,variant_name,variant_sku,model,fits,image_url,moq,stock_status,lead_time,active,sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  if (productsResult.error) {
    return emptyAdminProductsResult(productsResult.error.message);
  }

  if (categoriesResult.error) {
    return emptyAdminProductsResult(categoriesResult.error.message);
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
  const allProductRows = (productsResult.data ?? []) as ProductRow[];
  const variantsByProductId = new Map<string, VariantRow[]>();

  if (!variantsResult.error) {
    for (const variant of (variantsResult.data ?? []) as VariantRow[]) {
      variantsByProductId.set(variant.product_id, [...(variantsByProductId.get(variant.product_id) ?? []), variant]);
    }
  }

  const categoryProductCounts = computeCategoryProductCounts(allProductRows);
  const summary = computeAdminProductsSummary(allProductRows, variantsByProductId);
  const search = query.search?.trim() ?? "";
  const categoryId = query.categoryId ?? "all";
  const stockStatus = query.stockStatus ?? "all";
  const activeStatus = query.activeStatus ?? "all";
  const attention = query.attention ?? "all";
  const filteredRows = allProductRows.filter((product) => {
    const variants = variantsByProductId.get(product.id) ?? [];
    const searchMatch = productRowMatchesSearch(product, variants, categoriesById, search);
    const categoryMatch =
      categoryId === "all" ||
      product.category_id === categoryId ||
      product.subcategory_id === categoryId ||
      product.child_category_id === categoryId;
    const stockMatch = stockStatus === "all" || product.stock_status === stockStatus || variants.some((variant) => variant.stock_status === stockStatus);
    const activeMatch = activeStatus === "all" || (activeStatus === "active" ? Boolean(product.active) : !product.active);
    const attentionMatch =
      attention === "all" ||
      (attention === "unavailable" && productRowHasStockStatus(product, variants, "unavailable")) ||
      (attention === "low_stock" && productRowHasStockStatus(product, variants, "low_stock")) ||
      (attention === "missing_image" && productRowNeedsImage(product, variants)) ||
      (attention === "hidden" && !product.active);

    return searchMatch && categoryMatch && stockMatch && activeMatch && attentionMatch;
  });
  const totalProducts = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(totalProducts / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const pageProductIds = pageRows.map((product) => product.id);
  const tiersByProductId = new Map<string, AdminProductTier[]>();
  const adminVariantsByProductId = new Map<string, AdminProductVariant[]>();
  const tiersByVariantId = new Map<string, AdminProductTier[]>();

  let productIdsWithOrders = new Set<string>();

  if (pageProductIds.length) {
    const [tiersResult, orderItemsResult, pageVariantsResult] = await Promise.all([
      supabase.from("product_price_tiers").select("id,product_id,min_qty,max_qty,unit_price").in("product_id", pageProductIds).order("min_qty", { ascending: true }),
      supabase.from("order_items").select("product_id").in("product_id", pageProductIds),
      supabase
        .from("product_variants")
        .select("id,product_id,variant_name,variant_sku,model,fits,image_url,moq,stock_status,lead_time,active,sort_order")
        .in("product_id", pageProductIds)
        .order("sort_order", { ascending: true }),
    ]);

    if (!tiersResult.error) {
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
    }

    if (!orderItemsResult.error) {
      productIdsWithOrders = new Set(
        ((orderItemsResult.data ?? []) as { product_id: string | null }[])
          .map((item) => item.product_id)
          .filter((id): id is string => Boolean(id)),
      );
    }

    const pageVariantRows = pageVariantsResult.error ? [] : ((pageVariantsResult.data ?? []) as VariantRow[]);
    const variantIds = pageVariantRows.map((variant) => variant.id);

    if (variantIds.length) {
      const variantTiersResult = await supabase
        .from("product_variant_price_tiers")
        .select("id,variant_id,min_qty,max_qty,unit_price")
        .in("variant_id", variantIds)
        .order("min_qty", { ascending: true });

      if (!variantTiersResult.error) {
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
      }
    }

    for (const variant of pageVariantRows) {
      adminVariantsByProductId.set(variant.product_id, [
        ...(adminVariantsByProductId.get(variant.product_id) ?? []),
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

  const products = pageRows.map((product) => {
    const tiers = tiersByProductId.get(product.id) ?? [];
    const variants = adminVariantsByProductId.get(product.id) ?? [];
    const allPriceTiers = [...tiers, ...variants.flatMap((variant) => variant.tiers)];

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
      priceRange: getPriceRange(allPriceTiers),
      tiers,
      variants,
      hasOrderItems: productIdsWithOrders.has(product.id),
    };
  });

  return { products, categories, totalProducts, page, pageSize, summary, categoryProductCounts };
}
