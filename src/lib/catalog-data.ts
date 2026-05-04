import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  categories as mockCategories,
  getActiveCategories as getMockActiveCategories,
  getActiveProducts as getMockActiveProducts,
  getActiveProductBySlug as getMockActiveProductBySlug,
  getActiveProductsByCategory as getMockActiveProductsByCategory,
  type Category,
  type PriceTier,
  type Product,
  type ProductVariant,
} from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type ProductRow = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  | "id"
  | "sku"
  | "name"
  | "slug"
  | "category_id"
  | "subcategory_id"
  | "child_category_id"
  | "brand"
  | "model"
  | "moq"
  | "retail_price"
  | "stock_status"
  | "lead_time"
  | "image_url"
  | "description"
  | "active"
>;
type PriceTierRow = Pick<
  Database["public"]["Tables"]["product_price_tiers"]["Row"],
  "product_id" | "min_qty" | "max_qty" | "unit_price"
>;
type ProductImageRow = Pick<Database["public"]["Tables"]["product_images"]["Row"], "product_id" | "image_url" | "sort_order">;
type ProductVariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
type ProductVariantPriceTierRow = Pick<
  Database["public"]["Tables"]["product_variant_price_tiers"]["Row"],
  "variant_id" | "min_qty" | "max_qty" | "unit_price"
>;

type CatalogSnapshot = {
  categories: Category[];
  products: Product[];
  allCategoryRows: CategoryRow[];
};

export const CATALOG_CACHE_SECONDS = 60;
export const CATALOG_CACHE_TAG = "customer-catalog";

export type CatalogResult<T> = {
  data: T;
  source: "supabase" | "mock";
  message?: string;
};

const fallbackMessage =
  "Using mock catalog data because Supabase is not configured or the database is not reachable yet.";

function formatCatalogError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    return String(error.message);
  }

  return "Unknown Supabase catalog error.";
}

function toPriceTier(row: PriceTierRow): PriceTier {
  return {
    label: row.max_qty === null ? `${row.min_qty}+ pcs` : `${row.min_qty}-${row.max_qty} pcs`,
    min: row.min_qty,
    max: row.max_qty,
    price: Number(row.unit_price),
  };
}

function toStockStatus(status: string | null): Product["stockStatus"] {
  if (status === "ready_stock") {
    return "In stock";
  }

  if (status === "low_stock") {
    return "Low stock";
  }

  return "Preorder";
}

function toCategory(row: CategoryRow, itemCount = 0): Category {
  return {
    slug: row.slug,
    name: row.name_en,
    description: row.description ?? "Wholesale category",
    itemCount,
    active: Boolean(row.active),
    image: row.image_url || row.icon_url || undefined,
    level: row.level,
  };
}

function activePathIsVisible(product: ProductRow, activeCategoryIds: Set<string>) {
  return [product.category_id, product.subcategory_id, product.child_category_id]
    .filter((id): id is string => Boolean(id))
    .every((id) => activeCategoryIds.has(id));
}

function mapSupabaseSnapshot(
  categoryRows: CategoryRow[],
  productRows: ProductRow[],
  tierRows: PriceTierRow[],
  imageRows: ProductImageRow[],
  variantRows: ProductVariantRow[] = [],
  variantTierRows: ProductVariantPriceTierRow[] = [],
): CatalogSnapshot {
  const activeCategoryRows = categoryRows.filter((category) => category.active);
  const activeCategoryIds = new Set(activeCategoryRows.map((category) => category.id));
  const categoriesById = new Map(activeCategoryRows.map((category) => [category.id, category]));
  const tiersByProductId = new Map<string, PriceTierRow[]>();
  const imagesByProductId = new Map<string, ProductImageRow[]>();
  const variantsByProductId = new Map<string, ProductVariantRow[]>();
  const variantTiersByVariantId = new Map<string, ProductVariantPriceTierRow[]>();

  for (const tier of tierRows) {
    if (!tier.product_id) {
      continue;
    }

    tiersByProductId.set(tier.product_id, [...(tiersByProductId.get(tier.product_id) ?? []), tier]);
  }

  for (const image of imageRows) {
    if (!image.product_id) {
      continue;
    }

    imagesByProductId.set(image.product_id, [...(imagesByProductId.get(image.product_id) ?? []), image]);
  }

  for (const variant of variantRows) {
    if (!variant.active) {
      continue;
    }

    variantsByProductId.set(variant.product_id, [...(variantsByProductId.get(variant.product_id) ?? []), variant]);
  }

  for (const tier of variantTierRows) {
    variantTiersByVariantId.set(tier.variant_id, [...(variantTiersByVariantId.get(tier.variant_id) ?? []), tier]);
  }

  const visibleProductRows = productRows.filter(
    (product) => product.active && product.category_id && activePathIsVisible(product, activeCategoryIds),
  );

  const products = visibleProductRows.map((product, index): Product => {
    const category = product.category_id ? categoriesById.get(product.category_id) : undefined;
    const categoryPathSlugs = [product.category_id, product.subcategory_id, product.child_category_id]
      .map((id) => (id ? categoriesById.get(id)?.slug : undefined))
      .filter((slug): slug is string => Boolean(slug));
    const image = product.image_url || "/products/phone-accessories.svg";
    const gallery = (imagesByProductId.get(product.id) ?? [])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((item) => item.image_url);
    const details = [
      product.brand ? `Brand: ${product.brand}` : "",
      product.model ? `Model: ${product.model}` : "",
      product.lead_time ? `Lead time: ${product.lead_time}` : "",
      "Wholesale price tiers are manually maintained.",
    ].filter(Boolean);

    const tiers = (tiersByProductId.get(product.id) ?? []).sort((a, b) => a.min_qty - b.min_qty).map(toPriceTier);

    const variants = (variantsByProductId.get(product.id) ?? [])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((variant): ProductVariant => {
        const variantTiers = (variantTiersByVariantId.get(variant.id) ?? [])
          .sort((a, b) => a.min_qty - b.min_qty)
          .map((tier) => ({
            label: tier.max_qty === null ? `${tier.min_qty}+ pcs` : `${tier.min_qty}-${tier.max_qty} pcs`,
            min: tier.min_qty,
            max: tier.max_qty,
            price: Number(tier.unit_price),
          }));

        return {
          id: variant.id,
          productId: product.id,
          name: variant.variant_name,
          sku: variant.variant_sku ?? undefined,
          model: variant.model ?? undefined,
          fits: variant.fits ?? undefined,
          image: variant.image_url ?? undefined,
          moq: variant.moq ?? product.moq ?? 1,
          stockStatus: toStockStatus(variant.stock_status),
          leadTime: variant.lead_time ?? undefined,
          active: Boolean(variant.active),
          sortOrder: variant.sort_order ?? 0,
          tiers: variantTiers.length ? variantTiers : tiers,
        };
      });

    return {
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      category: category?.name_en ?? "Wholesale",
      categorySlug: category?.slug ?? "all",
      categoryPathSlugs,
      image,
      gallery: gallery.length ? gallery : [image],
      moq: product.moq ?? 1,
      retailPrice: product.retail_price === null ? null : Number(product.retail_price),
      stockStatus: toStockStatus(product.stock_status),
      stockCount: 0,
      sold: 900 - index * 37,
      rating: 4.6,
      description: product.description ?? "Wholesale product details will be maintained by admin.",
      details,
      tiers: tiers.length ? tiers : [{ label: "1+ pcs", min: 1, max: null, price: 0 }],
      variants,
      searchText: [
        product.sku,
        product.name,
        product.slug,
        product.brand,
        product.model,
        product.description,
        category?.name_en,
        category?.slug,
        ...categoryPathSlugs,
        ...variants.flatMap((variant) => [variant.name, variant.sku, variant.model, variant.fits, variant.leadTime]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    };
  });

  const productCountsByCategoryId = new Map<string, number>();
  for (const product of visibleProductRows) {
    for (const categoryId of [product.category_id, product.subcategory_id, product.child_category_id]) {
      if (categoryId) {
        productCountsByCategoryId.set(categoryId, (productCountsByCategoryId.get(categoryId) ?? 0) + 1);
      }
    }
  }

  const categories = activeCategoryRows
    .filter((category) => category.level === 1 && category.show_on_homepage)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((category): Category => toCategory(category, productCountsByCategoryId.get(category.id) ?? 0));

  return { categories, products, allCategoryRows: activeCategoryRows };
}

async function readSupabaseCatalogUncached(): Promise<CatalogSnapshot | null> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const [categoriesResult, productsResult, tiersResult, imagesResult, variantsResult, variantTiersResult] = await Promise.all([
    supabase
      .from("categories")
      .select(
        "id,name_en,name_zh,slug,parent_id,level,icon_url,image_url,active,show_on_homepage,show_in_navigation,sort_order,template_type,description,created_at,updated_at",
      )
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("customer_products")
      .select(
        "id,sku,name,slug,category_id,subcategory_id,child_category_id,brand,model,moq,retail_price,stock_status,lead_time,image_url,description,active",
      )
      .eq("active", true)
      .order("name", { ascending: true }),
    supabase.from("product_price_tiers").select("product_id,min_qty,max_qty,unit_price").order("min_qty", { ascending: true }),
    supabase.from("product_images").select("product_id,image_url,sort_order").order("sort_order", { ascending: true }),
    supabase
      .from("product_variants")
      .select("id,product_id,variant_name,variant_sku,model,fits,image_url,moq,stock_status,lead_time,active,sort_order,created_at,updated_at")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("product_variant_price_tiers").select("variant_id,min_qty,max_qty,unit_price").order("min_qty", { ascending: true }),
  ]);

  if (categoriesResult.error) {
    throw categoriesResult.error;
  }

  if (productsResult.error) {
    throw productsResult.error;
  }

  if (tiersResult.error) {
    throw tiersResult.error;
  }

  if (imagesResult.error) {
    throw imagesResult.error;
  }

  return mapSupabaseSnapshot(
    categoriesResult.data ?? [],
    productsResult.data ?? [],
    tiersResult.data ?? [],
    imagesResult.data ?? [],
    variantsResult.error ? [] : variantsResult.data ?? [],
    variantTiersResult.error ? [] : variantTiersResult.data ?? [],
  );
}

const readSupabaseCatalog = cache(
  unstable_cache(readSupabaseCatalogUncached, ["customer-catalog-v2"], {
    revalidate: CATALOG_CACHE_SECONDS,
    tags: [CATALOG_CACHE_TAG],
  }),
);

export async function getCatalogSnapshot(): Promise<CatalogResult<CatalogSnapshot>> {
  try {
    const snapshot = await readSupabaseCatalog();

    if (snapshot && snapshot.allCategoryRows.length) {
      return { data: snapshot, source: "supabase" };
    }

    return {
      data: {
        categories: getMockActiveCategories(),
        products: getMockActiveProducts(),
        allCategoryRows: [],
      },
      source: "mock",
      message: fallbackMessage,
    };
  } catch (error) {
    return {
      data: {
        categories: getMockActiveCategories(),
        products: getMockActiveProducts(),
        allCategoryRows: [],
      },
      source: "mock",
      message: `${fallbackMessage} ${formatCatalogError(error)}`,
    };
  }
}

export async function getCatalogCategoryParams() {
  const result = await getCatalogSnapshot();

  if (result.source === "supabase") {
    return [{ slug: "all" }, ...result.data.allCategoryRows.map((category) => ({ slug: category.slug }))];
  }

  return [{ slug: "all" }, ...result.data.categories.map((category) => ({ slug: category.slug }))];
}

export async function getCatalogNavigationCategories(): Promise<Category[]> {
  const result = await getCatalogSnapshot();

  if (result.source === "mock") {
    return getMockActiveCategories();
  }

  const productCountsByCategorySlug = new Map<string, number>();

  for (const product of result.data.products) {
    for (const slug of new Set([product.categorySlug, ...(product.categoryPathSlugs ?? [])])) {
      productCountsByCategorySlug.set(slug, (productCountsByCategorySlug.get(slug) ?? 0) + 1);
    }
  }

  return result.data.allCategoryRows
    .filter((category) => category.level === 1 && category.active && category.show_in_navigation)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((category) => toCategory(category, productCountsByCategorySlug.get(category.slug) ?? 0));
}

export async function getCatalogProductParams() {
  const result = await getCatalogSnapshot();
  return result.data.products.map((product) => ({ slug: product.slug }));
}

export async function getCatalogCategoryPage(slug: string): Promise<CatalogResult<{ categories: Category[]; products: Product[]; category: Category | null }>> {
  const result = await getCatalogSnapshot();
  const isAll = slug === "all";
  const categoryRow = isAll ? null : result.data.allCategoryRows.find((item) => item.slug === slug) ?? null;
  const products = isAll
    ? result.data.products
    : result.data.products.filter((product) => product.categorySlug === slug || product.categoryPathSlugs?.includes(slug));
  const category = isAll
    ? null
    : categoryRow
      ? toCategory(categoryRow, products.length)
      : result.data.categories.find((item) => item.slug === slug) ?? null;
  const filterCategories =
    result.source === "supabase"
      ? result.data.allCategoryRows
          .slice()
          .sort((a, b) => (a.level - b.level) || ((a.sort_order ?? 0) - (b.sort_order ?? 0)) || a.name_en.localeCompare(b.name_en))
          .map((item) => toCategory(item))
      : result.data.categories;

  if (!isAll && !category && result.source === "mock") {
    const mockCategory = mockCategories.find((item) => item.slug === slug) ?? null;
    return {
      data: {
        categories: getMockActiveCategories(),
        products: mockCategory ? getMockActiveProductsByCategory(slug) : [],
        category: mockCategory,
      },
      source: "mock",
      message: result.message,
    };
  }

  return {
    data: { categories: filterCategories, products, category },
    source: result.source,
    message: result.message,
  };
}

export async function getCatalogProductPage(slug: string): Promise<CatalogResult<{ product: Product | null; related: Product[] }>> {
  const result = await getCatalogSnapshot();
  const product = result.data.products.find((item) => item.slug === slug) ?? (result.source === "mock" ? getMockActiveProductBySlug(slug) ?? null : null);
  const products = result.source === "mock" ? getMockActiveProducts() : result.data.products;
  const related = product ? products.filter((item) => item.categorySlug === product.categorySlug && item.slug !== product.slug).slice(0, 3) : [];

  return {
    data: { product, related },
    source: result.source,
    message: result.message,
  };
}
