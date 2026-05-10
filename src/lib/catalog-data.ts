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
  | "created_at"
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

export type CatalogListingSort = "popular" | "latest" | "price-low" | "price-high";

export type CatalogCategoryListing = {
  categories: Category[];
  products: Product[];
  category: Category | null;
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

type CatalogListingOptions = {
  page?: number;
  pageSize?: number;
  query?: string;
  sort?: CatalogListingSort;
};

type ProductVariantSearchRow = Pick<
  Database["public"]["Tables"]["product_variants"]["Row"],
  "id" | "product_id" | "variant_name" | "variant_sku" | "model" | "fits" | "image_url" | "stock_status" | "active"
>;

export const CATALOG_CACHE_SECONDS = 60;
export const CATALOG_CACHE_TAG = "customer-catalog";

const categorySelectColumns =
  "id,name_en,name_zh,slug,parent_id,level,icon_url,image_url,active,show_on_homepage,show_in_navigation,sort_order,template_type,description,created_at,updated_at";
const productSelectColumns =
  "id,sku,name,slug,category_id,subcategory_id,child_category_id,brand,model,moq,retail_price,stock_status,lead_time,image_url,description,active,created_at";
const variantSelectColumns =
  "id,product_id,variant_name,variant_sku,model,fits,image_url,moq,stock_status,lead_time,active,sort_order,created_at,updated_at";

export type CatalogResult<T> = {
  data: T;
  source: "supabase" | "mock";
  message?: string;
};

const fallbackMessage =
  "Catalog is refreshing. Please reload in a moment or contact us on Messenger if you need help.";

function getFallbackCatalog(): CatalogSnapshot {
  if (process.env.NODE_ENV !== "production") {
    return {
      categories: getMockActiveCategories(),
      products: getMockActiveProducts(),
      allCategoryRows: [],
    };
  }

  return {
    categories: [],
    products: [],
    allCategoryRows: [],
  };
}

function getFallbackCatalogSource(): CatalogResult<CatalogSnapshot>["source"] {
  return process.env.NODE_ENV === "production" ? "supabase" : "mock";
}

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

  if (status === "unavailable") {
    return "Unavailable";
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

function normalizeCatalogSearch(value: string) {
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

function compactCatalogSearch(value: string) {
  return normalizeCatalogSearch(value).replace(/\s+/g, "");
}

const catalogSearchAliases: Record<string, string[]> = {
  accessory: ["accessories"],
  accessories: ["accessory"],
  absorber: ["shock", "suspension"],
  aerox: ["yamaha"],
  automotive: ["car", "vehicle"],
  box: ["topbox", "motobox"],
  beat: ["honda"],
  bracket: ["mount", "holder"],
  brake: ["break", "lever"],
  breaks: ["brake"],
  cable: ["wire", "charger"],
  cables: ["wire", "charger"],
  cap: ["helmet"],
  child: ["kids", "helmet"],
  cleaner: ["cleaning", "spray"],
  click: ["honda"],
  coolant: ["fluid"],
  full: ["helmet"],
  gille: ["helmet"],
  half: ["helmet"],
  helmet: ["helmets", "half", "full", "modular", "visor"],
  helmets: ["helmet"],
  hnj: ["helmet"],
  key: ["keyset", "ignition", "switch"],
  keyset: ["key", "ignition", "switch"],
  lock: ["security"],
  locks: ["security"],
  mio: ["yamaha"],
  mob: ["helmet"],
  modular: ["helmet"],
  moto: ["motorcycle"],
  motobox: ["topbox", "box"],
  motorcycle: ["moto"],
  nmax: ["yamaha"],
  phone: ["accessory", "accessories"],
  seat: ["saddle"],
  shock: ["absorber", "suspension"],
  shocks: ["shock", "absorber", "suspension"],
  switch: ["ignition", "keyset"],
  topbox: ["top", "box", "bracket", "mount"],
  visor: ["helmet", "shield"],
  zebra: ["helmet"],
};

const catalogSearchStopWords = new Set(["a", "an", "and", "for", "of", "the", "to", "with"]);

function expandCatalogSearchWords(words: string[]) {
  const expanded = new Set(words);

  for (const word of words) {
    const singular = word.endsWith("s") && word.length > 3 ? word.slice(0, -1) : "";
    const aliases = catalogSearchAliases[word] ?? [];

    if (singular) {
      expanded.add(singular);
    }

    for (const alias of aliases) {
      expanded.add(alias);
    }
  }

  return Array.from(expanded);
}

function catalogWordDistance(a: string, b: string) {
  if (a === b) {
    return 0;
  }

  if (Math.abs(a.length - b.length) > 2) {
    return 3;
  }

  let edits = 0;
  const length = Math.min(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    if (a[index] !== b[index]) {
      edits += 1;
    }

    if (edits > 2) {
      return edits;
    }
  }

  return edits + Math.abs(a.length - b.length);
}

function buildVariantSearchText(variants: ProductVariantSearchRow[]) {
  return variants.map((variant) => [variant.variant_name, variant.variant_sku, variant.model, variant.fits].filter(Boolean).join(" ")).join(" ");
}

function catalogProductSearchScore(
  product: ProductRow,
  query: string,
  categoryNames: string,
  variantSearchText: string,
) {
  const originalWords = normalizeCatalogSearch(query)
    .split(" ")
    .filter((word) => word.length > 1 && !catalogSearchStopWords.has(word));
  const words = expandCatalogSearchWords(originalWords);

  if (!originalWords.length) {
    return 1;
  }

  const fields = {
    sku: normalizeCatalogSearch(product.sku ?? ""),
    name: normalizeCatalogSearch(product.name),
    category: normalizeCatalogSearch(categoryNames),
    description: normalizeCatalogSearch(product.description ?? ""),
    extra: normalizeCatalogSearch([product.slug, product.brand, product.model].filter(Boolean).join(" ")),
    variants: normalizeCatalogSearch(variantSearchText),
  };
  const haystack = Object.values(fields).join(" ");
  const haystackWordList = haystack.split(" ").filter(Boolean);
  const haystackWords = new Set(haystackWordList);
  const normalizedQuery = normalizeCatalogSearch(query);
  const compactQuery = compactCatalogSearch(query);
  const compactHaystack = compactCatalogSearch([product.name, product.sku ?? "", categoryNames, product.description ?? "", product.slug, product.brand, product.model, variantSearchText].join(" "));
  let score = 0;
  let matchedWords = 0;
  let originalMatchedWords = 0;

  if (compactQuery && compactHaystack.includes(compactQuery)) {
    score += 90;
    matchedWords = words.length;
    originalMatchedWords = originalWords.length;
  }

  if (normalizedQuery && fields.name.includes(normalizedQuery)) {
    score += 70;
  }

  if (compactQuery && compactCatalogSearch(fields.sku).includes(compactQuery)) {
    score += 120;
  }

  for (const word of words) {
    let matched = false;

    if (haystackWords.has(word)) {
      score += 16;
      matched = true;
    } else if (haystack.includes(word)) {
      score += 8;
      matched = true;
    } else if (haystackWordList.some((item) => item.startsWith(word) || word.startsWith(item))) {
      score += 6;
      matched = true;
    } else if (word.length > 4 && haystackWordList.some((item) => item.length > 4 && catalogWordDistance(word, item) <= 1)) {
      score += 4;
      matched = true;
    }

    if (fields.name.includes(word)) {
      score += 10;
    }

    if (fields.sku.includes(word)) {
      score += 14;
    }

    if (fields.variants.includes(word)) {
      score += 8;
    }

    if (matched) {
      matchedWords += 1;
      if (originalWords.includes(word)) {
        originalMatchedWords += 1;
      }
    }
  }

  if (originalWords.length > 1 && originalMatchedWords < Math.ceil(originalWords.length / 2)) {
    return 0;
  }

  if (originalWords.length > 1 && originalMatchedWords === originalWords.length) {
    score += 30 + originalWords.length * 5;
  }

  return matchedWords > 0 ? score + originalMatchedWords * 12 : 0;
}

function getListingStockRank(product: ProductRow) {
  if (product.stock_status === "ready_stock") {
    return 0;
  }

  if (product.stock_status === "low_stock") {
    return 1;
  }

  if (product.stock_status === "for_order") {
    return 2;
  }

  return 3;
}

function getProductCreatedTimestamp(product: ProductRow) {
  const timestamp = product.created_at ? new Date(product.created_at).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
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

  const products = visibleProductRows.map((product): Product => {
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
      sold: 0,
      rating: 0,
      createdAt: product.created_at,
      description: product.description ?? "Wholesale product details will be maintained by admin.",
      details,
      tiers,
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
  const supabase = createServerSupabaseClient({
    cache: "force-cache",
    next: {
      revalidate: CATALOG_CACHE_SECONDS,
      tags: [CATALOG_CACHE_TAG],
    },
  });

  if (!supabase) {
    return null;
  }

  const [categoriesResult, productsResult, tiersResult, imagesResult, variantsResult, variantTiersResult] = await Promise.all([
    supabase
      .from("categories")
      .select(categorySelectColumns)
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("customer_products")
      .select(productSelectColumns)
      .eq("active", true)
      .order("name", { ascending: true }),
    supabase.from("product_price_tiers").select("product_id,min_qty,max_qty,unit_price").order("min_qty", { ascending: true }),
    supabase.from("product_images").select("product_id,image_url,sort_order").order("sort_order", { ascending: true }),
    supabase
      .from("product_variants")
      .select(variantSelectColumns)
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
      data: getFallbackCatalog(),
      source: getFallbackCatalogSource(),
      message: fallbackMessage,
    };
  } catch (error) {
    return {
      data: getFallbackCatalog(),
      source: getFallbackCatalogSource(),
      message: process.env.NODE_ENV === "production" ? fallbackMessage : `${fallbackMessage} ${formatCatalogError(error)}`,
    };
  }
}

function getProductListingLowestPrice(product: Product) {
  const prices = [
    ...(product.tiers ?? []).map((tier) => tier.price),
    ...(product.variants ?? []).flatMap((variant) => (variant.tiers ?? []).map((tier) => tier.price)),
  ];

  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
}

function getProductListingHighestPrice(product: Product) {
  const prices = [
    ...(product.tiers ?? []).map((tier) => tier.price),
    ...(product.variants ?? []).flatMap((variant) => (variant.tiers ?? []).map((tier) => tier.price)),
  ];

  return prices.length ? Math.max(...prices) : 0;
}

function compareCatalogProductsFallback(sort: CatalogListingSort) {
  return (a: Product, b: Product) => {
    if (sort === "latest") {
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      return bTime - aTime || b.slug.localeCompare(a.slug);
    }

    if (sort === "price-low") {
      return getProductListingLowestPrice(a) - getProductListingLowestPrice(b);
    }

    if (sort === "price-high") {
      return getProductListingHighestPrice(b) - getProductListingHighestPrice(a);
    }

    const stockRank = (product: Product) => (product.stockStatus === "In stock" ? 0 : product.stockStatus === "Low stock" ? 1 : product.stockStatus === "Preorder" ? 2 : 3);
    const imageRank = (product: Product) => (product.image && !product.image.includes("phone-accessories.svg") ? 0 : 1);

    return stockRank(a) - stockRank(b) || imageRank(a) - imageRank(b) || a.name.localeCompare(b.name);
  };
}

function categorySearchNames(product: ProductRow, categoriesById: Map<string, CategoryRow>) {
  return [product.category_id, product.subcategory_id, product.child_category_id]
    .map((id) => (id ? categoriesById.get(id)?.name_en : undefined))
    .filter(Boolean)
    .join(" ");
}

async function getPriceSortMap(productIds: string[]) {
  const supabase = createServerSupabaseClient();
  const priceByProductId = new Map<string, number>();

  if (!supabase || !productIds.length) {
    return priceByProductId;
  }

  const tiersResult = await supabase
    .from("product_price_tiers")
    .select("product_id,unit_price")
    .in("product_id", productIds);

  if (!tiersResult.error) {
    for (const tier of tiersResult.data ?? []) {
      const price = Number(tier.unit_price);
      if (Number.isFinite(price)) {
        priceByProductId.set(tier.product_id, Math.min(priceByProductId.get(tier.product_id) ?? Number.POSITIVE_INFINITY, price));
      }
    }
  }

  const variantsResult = await supabase.from("product_variants").select("id,product_id").in("product_id", productIds).eq("active", true);
  const variantsById = new Map((variantsResult.error ? [] : variantsResult.data ?? []).map((variant) => [variant.id, variant.product_id]));
  const variantIds = Array.from(variantsById.keys());

  if (variantIds.length) {
    const variantTiersResult = await supabase.from("product_variant_price_tiers").select("variant_id,unit_price").in("variant_id", variantIds);

    if (!variantTiersResult.error) {
      for (const tier of variantTiersResult.data ?? []) {
        const productId = variantsById.get(tier.variant_id);
        const price = Number(tier.unit_price);
        if (productId && Number.isFinite(price)) {
          priceByProductId.set(productId, Math.min(priceByProductId.get(productId) ?? Number.POSITIVE_INFINITY, price));
        }
      }
    }
  }

  return priceByProductId;
}

async function getCatalogCategoryListingFromFallback(
  slug: string,
  options: Required<CatalogListingOptions>,
): Promise<CatalogResult<CatalogCategoryListing>> {
  const catalog = await getCatalogCategoryPage(slug);
  const searchText = options.query.trim().toLowerCase();
  const products = searchText
    ? catalog.data.products
        .map((product) => ({ product, score: catalogProductSearchScore(
          {
            id: product.id ?? product.slug,
            sku: product.sku ?? product.slug,
            name: product.name,
            slug: product.slug,
            category_id: "",
            subcategory_id: null,
            child_category_id: null,
            brand: null,
            model: null,
            moq: product.moq,
            retail_price: product.retailPrice ?? null,
            stock_status: product.stockStatus,
            lead_time: null,
            image_url: product.image,
            description: product.description ?? "",
            active: true,
            created_at: product.createdAt ?? null,
          },
          searchText,
          product.category,
          product.variants?.map((variant) => [variant.name, variant.sku, variant.model, variant.fits].filter(Boolean).join(" ")).join(" ") ?? "",
        ) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || compareCatalogProductsFallback(options.sort)(a.product, b.product))
        .map((item) => item.product)
    : catalog.data.products.slice().sort(compareCatalogProductsFallback(options.sort));
  const totalPages = Math.max(1, Math.ceil(products.length / options.pageSize));
  const currentPage = Math.min(Math.max(1, options.page), totalPages);
  const paginatedProducts = products.slice((currentPage - 1) * options.pageSize, currentPage * options.pageSize);

  return {
    data: {
      ...catalog.data,
      products: paginatedProducts,
      totalProducts: products.length,
      totalPages,
      currentPage,
      pageSize: options.pageSize,
    },
    source: catalog.source,
    message: catalog.message,
  };
}

export async function getCatalogCategoryListingPage(
  slug: string,
  options: CatalogListingOptions = {},
): Promise<CatalogResult<CatalogCategoryListing>> {
  const pageSize = Math.min(Math.max(1, Math.floor(options.pageSize ?? 48)), 96);
  const requestedPage = Math.max(1, Math.floor(options.page ?? 1));
  const query = (options.query ?? "").trim();
  const sort = options.sort ?? "popular";
  const normalizedOptions = { page: requestedPage, pageSize, query, sort };
  const supabase = createServerSupabaseClient({
    cache: "force-cache",
    next: {
      revalidate: CATALOG_CACHE_SECONDS,
      tags: [CATALOG_CACHE_TAG],
    },
  });

  if (!supabase) {
    return getCatalogCategoryListingFromFallback(slug, normalizedOptions);
  }

  try {
    const categoriesResult = await supabase
      .from("categories")
      .select(categorySelectColumns)
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (categoriesResult.error) {
      throw categoriesResult.error;
    }

    const categoryRows = categoriesResult.data ?? [];
    const activeCategoryIds = new Set(categoryRows.map((category) => category.id));
    const categoriesById = new Map(categoryRows.map((category) => [category.id, category]));
    const isAll = slug === "all";
    const selectedCategory = isAll ? null : categoryRows.find((category) => category.slug === slug) ?? null;

    if (!isAll && !selectedCategory) {
      return {
        data: { categories: [], products: [], category: null, totalProducts: 0, totalPages: 1, currentPage: 1, pageSize },
        source: "supabase",
      };
    }

    let productsQuery = supabase
      .from("customer_products")
      .select(productSelectColumns, { count: "exact" })
      .eq("active", true);

    if (selectedCategory) {
      productsQuery = productsQuery.or(
        `category_id.eq.${selectedCategory.id},subcategory_id.eq.${selectedCategory.id},child_category_id.eq.${selectedCategory.id}`,
      );
    }

    const activeCategoryIdList = Array.from(activeCategoryIds);
    if (activeCategoryIdList.length) {
      productsQuery = productsQuery.in("category_id", activeCategoryIdList);
    }

    if (!query && (sort === "popular" || sort === "latest")) {
      const from = (requestedPage - 1) * pageSize;
      const to = from + pageSize - 1;
      const productsResult = await (sort === "latest"
        ? productsQuery.order("created_at", { ascending: false }).order("slug", { ascending: false })
        : productsQuery.order("name", { ascending: true }))
        .range(from, to);

      if (productsResult.error) {
        throw productsResult.error;
      }

      const pageRows = (productsResult.data ?? []).filter(
        (product) => product.active && product.category_id && activePathIsVisible(product, activeCategoryIds),
      );
      const pageProductIds = pageRows.map((product) => product.id);
      let tierRows: PriceTierRow[] = [];
      let imageRows: ProductImageRow[] = [];
      let variantRows: ProductVariantRow[] = [];
      let variantTierRows: ProductVariantPriceTierRow[] = [];

      if (pageProductIds.length) {
        const [tiersResult, imagesResult, variantsResult] = await Promise.all([
          supabase.from("product_price_tiers").select("product_id,min_qty,max_qty,unit_price").in("product_id", pageProductIds).order("min_qty", { ascending: true }),
          supabase.from("product_images").select("product_id,image_url,sort_order").in("product_id", pageProductIds).order("sort_order", { ascending: true }),
          supabase
            .from("product_variants")
            .select(variantSelectColumns)
            .in("product_id", pageProductIds)
            .eq("active", true)
            .order("sort_order", { ascending: true }),
        ]);

        tierRows = tiersResult.error ? [] : tiersResult.data ?? [];
        imageRows = imagesResult.error ? [] : imagesResult.data ?? [];
        variantRows = variantsResult.error ? [] : variantsResult.data ?? [];

        const variantIds = variantRows.map((variant) => variant.id);
        if (variantIds.length) {
          const variantTiersResult = await supabase
            .from("product_variant_price_tiers")
            .select("variant_id,min_qty,max_qty,unit_price")
            .in("variant_id", variantIds)
            .order("min_qty", { ascending: true });

          variantTierRows = variantTiersResult.error ? [] : variantTiersResult.data ?? [];
        }
      }

      const totalProducts = productsResult.count ?? pageRows.length;
      const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
      const currentPage = Math.min(requestedPage, totalPages);
      const mapped = mapSupabaseSnapshot(categoryRows, pageRows, tierRows, imageRows, variantRows, variantTierRows);
      const filterCategories = categoryRows
        .slice()
        .sort((a, b) => a.level - b.level || (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name_en.localeCompare(b.name_en))
        .map((item) => toCategory(item));
      const category = isAll ? null : selectedCategory ? toCategory(selectedCategory, totalProducts) : null;

      return {
        data: {
          categories: filterCategories,
          products: mapped.products,
          category,
          totalProducts,
          totalPages,
          currentPage,
          pageSize,
        },
        source: "supabase",
      };
    }

    const productsResult = await productsQuery.order("name", { ascending: true });

    if (productsResult.error) {
      throw productsResult.error;
    }

    let productRows = (productsResult.data ?? []).filter(
      (product) => product.active && product.category_id && activePathIsVisible(product, activeCategoryIds),
    );
    const categoryIdCounts = new Map<string, number>();

    for (const product of productRows) {
      for (const categoryId of [product.category_id, product.subcategory_id, product.child_category_id]) {
        if (categoryId) {
          categoryIdCounts.set(categoryId, (categoryIdCounts.get(categoryId) ?? 0) + 1);
        }
      }
    }

    const variantSearchByProductId = new Map<string, ProductVariantSearchRow[]>();

    if (query) {
      const productIds = productRows.map((product) => product.id);
      if (productIds.length) {
        const variantsResult = await supabase
          .from("product_variants")
          .select("id,product_id,variant_name,variant_sku,model,fits,image_url,stock_status,active")
          .in("product_id", productIds)
          .eq("active", true);

        if (!variantsResult.error) {
          for (const variant of variantsResult.data ?? []) {
            variantSearchByProductId.set(variant.product_id, [...(variantSearchByProductId.get(variant.product_id) ?? []), variant]);
          }
        }
      }

      productRows = productRows
        .map((product) => {
          const score = catalogProductSearchScore(
            product,
            query,
            categorySearchNames(product, categoriesById),
            buildVariantSearchText(variantSearchByProductId.get(product.id) ?? []),
          );
          return { product, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.product);
    }

    if (!query || sort !== "popular") {
      if (sort === "latest") {
        productRows = productRows.slice().sort((a, b) => getProductCreatedTimestamp(b) - getProductCreatedTimestamp(a) || b.slug.localeCompare(a.slug));
      } else if (sort === "price-low" || sort === "price-high") {
        const priceByProductId = await getPriceSortMap(productRows.map((product) => product.id));
        productRows = productRows.slice().sort((a, b) => {
          const aPrice = priceByProductId.get(a.id) ?? Number.POSITIVE_INFINITY;
          const bPrice = priceByProductId.get(b.id) ?? Number.POSITIVE_INFINITY;
          return sort === "price-low" ? aPrice - bPrice || a.name.localeCompare(b.name) : bPrice - aPrice || a.name.localeCompare(b.name);
        });
      } else {
        productRows = productRows.slice().sort((a, b) => {
          const imageRankA = a.image_url ? 0 : 1;
          const imageRankB = b.image_url ? 0 : 1;
          return getListingStockRank(a) - getListingStockRank(b) || imageRankA - imageRankB || a.name.localeCompare(b.name);
        });
      }
    }

    const totalProducts = productRows.length;
    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
    const currentPage = Math.min(requestedPage, totalPages);
    const pageRows = productRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const pageProductIds = pageRows.map((product) => product.id);
    let tierRows: PriceTierRow[] = [];
    let imageRows: ProductImageRow[] = [];
    let variantRows: ProductVariantRow[] = [];
    let variantTierRows: ProductVariantPriceTierRow[] = [];

    if (pageProductIds.length) {
      const [tiersResult, imagesResult, variantsResult] = await Promise.all([
        supabase.from("product_price_tiers").select("product_id,min_qty,max_qty,unit_price").in("product_id", pageProductIds).order("min_qty", { ascending: true }),
        supabase.from("product_images").select("product_id,image_url,sort_order").in("product_id", pageProductIds).order("sort_order", { ascending: true }),
        supabase
          .from("product_variants")
          .select(variantSelectColumns)
          .in("product_id", pageProductIds)
          .eq("active", true)
          .order("sort_order", { ascending: true }),
      ]);

      tierRows = tiersResult.error ? [] : tiersResult.data ?? [];
      imageRows = imagesResult.error ? [] : imagesResult.data ?? [];
      variantRows = variantsResult.error ? [] : variantsResult.data ?? [];

      const variantIds = variantRows.map((variant) => variant.id);
      if (variantIds.length) {
        const variantTiersResult = await supabase
          .from("product_variant_price_tiers")
          .select("variant_id,min_qty,max_qty,unit_price")
          .in("variant_id", variantIds)
          .order("min_qty", { ascending: true });

        variantTierRows = variantTiersResult.error ? [] : variantTiersResult.data ?? [];
      }
    }

    const mapped = mapSupabaseSnapshot(categoryRows, pageRows, tierRows, imageRows, variantRows, variantTierRows);
    const filterCategories = categoryRows
      .slice()
      .sort((a, b) => a.level - b.level || (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name_en.localeCompare(b.name_en))
      .map((item) => toCategory(item, categoryIdCounts.get(item.id) ?? 0));
    const category = isAll ? null : selectedCategory ? toCategory(selectedCategory, totalProducts) : null;

    return {
      data: {
        categories: filterCategories,
        products: mapped.products,
        category,
        totalProducts,
        totalPages,
        currentPage,
        pageSize,
      },
      source: "supabase",
    };
  } catch (error) {
    const fallback = await getCatalogCategoryListingFromFallback(slug, normalizedOptions);
    return {
      ...fallback,
      message: process.env.NODE_ENV === "production" ? fallbackMessage : `${fallbackMessage} ${formatCatalogError(error)}`,
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

async function getCatalogProductPageFromSnapshot(slug: string): Promise<CatalogResult<{ product: Product | null; related: Product[] }>> {
  const result = await getCatalogSnapshot();
  const product = result.data.products.find((item) => item.slug === slug) ?? (result.source === "mock" ? getMockActiveProductBySlug(slug) ?? null : null);
  const products = result.source === "mock" ? getMockActiveProducts() : result.data.products;
  const related = product ? getRelatedProducts(product, products) : [];

  return {
    data: { product, related },
    source: result.source,
    message: result.message,
  };
}

export async function getCatalogProductPage(slug: string): Promise<CatalogResult<{ product: Product | null; related: Product[] }>> {
  const supabase = createServerSupabaseClient({
    cache: "force-cache",
    next: {
      revalidate: CATALOG_CACHE_SECONDS,
      tags: [CATALOG_CACHE_TAG],
    },
  });

  if (!supabase) {
    return getCatalogProductPageFromSnapshot(slug);
  }

  try {
    const [categoriesResult, productResult] = await Promise.all([
      supabase
        .from("categories")
        .select(categorySelectColumns)
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("customer_products")
        .select(productSelectColumns)
        .eq("active", true)
        .eq("slug", slug)
        .limit(1),
    ]);

    if (categoriesResult.error) {
      throw categoriesResult.error;
    }

    if (productResult.error) {
      throw productResult.error;
    }

    const categoryRows = categoriesResult.data ?? [];
    const activeCategoryIds = new Set(categoryRows.map((category) => category.id));
    const productRow = (productResult.data ?? [])[0] ?? null;

    if (!productRow || !productRow.category_id || !activePathIsVisible(productRow, activeCategoryIds)) {
      return {
        data: { product: null, related: [] },
        source: "supabase",
      };
    }

    const relatedCategoryId = productRow.child_category_id ?? productRow.subcategory_id ?? productRow.category_id;
    const relatedResult = await supabase
      .from("customer_products")
      .select(productSelectColumns)
      .eq("active", true)
      .neq("id", productRow.id)
      .or(`category_id.eq.${relatedCategoryId},subcategory_id.eq.${relatedCategoryId},child_category_id.eq.${relatedCategoryId}`)
      .order("name", { ascending: true })
      .limit(24);
    const relatedRows = (relatedResult.error ? [] : relatedResult.data ?? []).filter(
      (product) => product.category_id && activePathIsVisible(product, activeCategoryIds),
    );
    const productRows = [productRow, ...relatedRows];
    const productIds = productRows.map((product) => product.id);
    let tierRows: PriceTierRow[] = [];
    let imageRows: ProductImageRow[] = [];
    let variantRows: ProductVariantRow[] = [];
    let variantTierRows: ProductVariantPriceTierRow[] = [];

    if (productIds.length) {
      const [tiersResult, imagesResult, variantsResult] = await Promise.all([
        supabase.from("product_price_tiers").select("product_id,min_qty,max_qty,unit_price").in("product_id", productIds).order("min_qty", { ascending: true }),
        supabase.from("product_images").select("product_id,image_url,sort_order").in("product_id", productIds).order("sort_order", { ascending: true }),
        supabase
          .from("product_variants")
          .select(variantSelectColumns)
          .in("product_id", productIds)
          .eq("active", true)
          .order("sort_order", { ascending: true }),
      ]);

      tierRows = tiersResult.error ? [] : tiersResult.data ?? [];
      imageRows = imagesResult.error ? [] : imagesResult.data ?? [];
      variantRows = variantsResult.error ? [] : variantsResult.data ?? [];

      const variantIds = variantRows.map((variant) => variant.id);
      if (variantIds.length) {
        const variantTiersResult = await supabase
          .from("product_variant_price_tiers")
          .select("variant_id,min_qty,max_qty,unit_price")
          .in("variant_id", variantIds)
          .order("min_qty", { ascending: true });

        variantTierRows = variantTiersResult.error ? [] : variantTiersResult.data ?? [];
      }
    }

    const mapped = mapSupabaseSnapshot(categoryRows, productRows, tierRows, imageRows, variantRows, variantTierRows);
    const product = mapped.products.find((item) => item.slug === slug) ?? null;

    return {
      data: {
        product,
        related: product ? getRelatedProducts(product, mapped.products) : [],
      },
      source: "supabase",
    };
  } catch (error) {
    const fallback = await getCatalogProductPageFromSnapshot(slug);
    return {
      ...fallback,
      message: process.env.NODE_ENV === "production" ? fallbackMessage : `${fallbackMessage} ${formatCatalogError(error)}`,
    };
  }
}

function normalizeRelatedText(value: string) {
  return value
    .toLowerCase()
    .replace(/([a-z])([0-9])/g, "$1 $2")
    .replace(/([0-9])([a-z])/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function relatedWords(product: Product) {
  return new Set(
    normalizeRelatedText([
      product.name,
      product.sku ?? "",
      product.category,
      product.description,
      product.details.join(" "),
      product.searchText ?? "",
      product.variants?.map((variant) => [variant.name, variant.sku ?? "", variant.model ?? "", variant.fits ?? ""].join(" ")).join(" ") ?? "",
    ].join(" "))
      .split(" ")
      .filter((word) => word.length > 2),
  );
}

function getRelatedProducts(product: Product, products: Product[]) {
  const baseWords = relatedWords(product);
  const basePath = new Set([product.categorySlug, ...(product.categoryPathSlugs ?? [])]);

  return products
    .filter((item) => item.slug !== product.slug)
    .map((item) => {
      const itemPath = [item.categorySlug, ...(item.categoryPathSlugs ?? [])];
      const sharedCategoryScore = itemPath.reduce((score, slug) => score + (basePath.has(slug) ? 24 : 0), 0);
      const itemWords = relatedWords(item);
      let sharedWordScore = 0;

      for (const word of itemWords) {
        if (baseWords.has(word)) {
          sharedWordScore += 3;
        }
      }

      const stockScore = item.stockStatus === "In stock" ? 8 : item.stockStatus === "Low stock" ? 3 : 0;
      const popularityScore = Math.min(18, Math.floor((item.sold ?? 0) / 300));

      return { item, score: sharedCategoryScore + sharedWordScore + stockScore + popularityScore };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || (b.item.sold ?? 0) - (a.item.sold ?? 0))
    .slice(0, 4)
    .map((entry) => entry.item);
}
