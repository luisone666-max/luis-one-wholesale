import Link from "next/link";
import type { Metadata } from "next";
import { Container, MarketplaceShell } from "@/components/CustomerUi";
import { DataSourceNotice } from "@/components/DataSourceNotice";
import { ProductCard } from "@/components/ProductCard";
import { SearchEventTracker } from "@/components/SearchEventTracker";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderServer as SiteHeader } from "@/components/SiteHeaderServer";
import { getCatalogCategoryPage, getCatalogCategoryParams } from "@/lib/catalog-data";
import { getProductPriceTiers, type Product } from "@/lib/mock-data";
import { absoluteUrl, categoryDescription, getSiteUrl, siteName } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  return getCatalogCategoryParams();
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ q?: string; sort?: string; page?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const catalog = await getCatalogCategoryPage(slug);
  const { category } = catalog.data;
  const isAll = slug === "all";
  const searchQuery = (query?.q ?? "").trim();
  const page = query?.page ? Number(query.page) : 1;
  const canonical = `${getSiteUrl()}/category/${slug}`;

  if (!isAll && !category) {
    return {
      title: `Category not found | ${siteName}`,
      description: "Browse current wholesale product categories from Luis One Supply Hub.",
      alternates: { canonical },
      robots: { index: false, follow: true },
    };
  }

  const title = searchQuery
    ? `Search ${searchQuery} Wholesale Products | ${siteName}`
    : isAll
      ? `Wholesale Products Philippines | ${siteName}`
      : `${category?.name} Wholesale Philippines | ${siteName}`;
  const description = searchQuery
    ? `Search public wholesale products for "${searchQuery}" at Luis One Supply Hub. Browse prices, MOQ, stock status, and order online.`
    : categoryDescription(category);
  const image = absoluteUrl(category?.image ?? "/brand/luis-one-logo.jpg");

  return {
    title,
    description,
    alternates: { canonical },
    robots: searchQuery || page > 1 ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 1200,
          alt: category?.name ?? siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

const pageSize = 48;
const sortOptions = [
  { label: "Popular", shortLabel: "Popular", value: "popular" },
  { label: "Latest", shortLabel: "Latest", value: "latest" },
  { label: "Price Low to High", shortLabel: "Low Price", value: "price-low" },
  { label: "Price High to Low", shortLabel: "High Price", value: "price-high" },
];

function getLowestPrice(product: Product) {
  const prices = getProductPriceTiers(product).map((tier) => tier.price);
  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
}

function getHighestPrice(product: Product) {
  const prices = getProductPriceTiers(product).map((tier) => tier.price);
  return prices.length ? Math.max(...prices) : 0;
}

function getProductCreatedTime(product: { createdAt?: string | null; slug: string }) {
  if (!product.createdAt) {
    return 0;
  }

  const time = Date.parse(product.createdAt);
  return Number.isFinite(time) ? time : 0;
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];

  sortedPages.forEach((page, index) => {
    const previous = sortedPages[index - 1];
    if (previous && page - previous > 1) {
      items.push("ellipsis");
    }
    items.push(page);
  });

  return items;
}

function normalizeSearch(value: string) {
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

function compactSearch(value: string) {
  return normalizeSearch(value).replace(/\s+/g, "");
}

const searchAliases: Record<string, string[]> = {
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
const searchStopWords = new Set(["a", "an", "and", "for", "of", "the", "to", "with"]);

function expandSearchWords(words: string[]) {
  const expanded = new Set(words);

  for (const word of words) {
    const singular = word.endsWith("s") && word.length > 3 ? word.slice(0, -1) : "";
    const aliases = searchAliases[word] ?? [];

    if (singular) {
      expanded.add(singular);
    }

    for (const alias of aliases) {
      expanded.add(alias);
    }
  }

  return Array.from(expanded);
}

function wordDistance(a: string, b: string) {
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

type SearchableProduct = {
  name: string;
  sku?: string;
  category: string;
  description: string;
  details: string[];
  searchText?: string;
  variants?: {
    name: string;
    sku?: string;
    model?: string;
    fits?: string;
  }[];
};

function productSearchScore(product: SearchableProduct, query: string) {
  const originalWords = normalizeSearch(query)
    .split(" ")
    .filter((word) => word.length > 1 && !searchStopWords.has(word));
  const words = expandSearchWords(originalWords);

  if (!originalWords.length) {
    return 1;
  }

  const fields = {
    sku: normalizeSearch(product.sku ?? ""),
    name: normalizeSearch(product.name),
    category: normalizeSearch(product.category),
    description: normalizeSearch(product.description),
    details: normalizeSearch(product.details.join(" ")),
    extra: normalizeSearch(product.searchText ?? ""),
    variants: normalizeSearch(
      product.variants?.map((variant) => [variant.name, variant.sku, variant.model, variant.fits].filter(Boolean).join(" ")).join(" ") ?? "",
    ),
  };
  const haystack = Object.values(fields).join(" ");
  const haystackWordList = haystack.split(" ").filter(Boolean);
  const haystackWords = new Set(haystackWordList);
  const normalizedQuery = normalizeSearch(query);
  const compactQuery = compactSearch(query);
  const compactHaystack = compactSearch([
    product.name,
    product.sku ?? "",
    product.category,
    product.description,
    product.details.join(" "),
    product.searchText ?? "",
    product.variants?.map((variant) => [variant.name, variant.sku, variant.model, variant.fits].filter(Boolean).join(" ")).join(" ") ?? "",
  ].join(" "));
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

  if (compactQuery && compactSearch(fields.sku).includes(compactQuery)) {
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
    } else if (word.length > 4 && haystackWordList.some((item) => item.length > 4 && wordDistance(word, item) <= 1)) {
      score += 4;
      matched = true;
    }

    if (fields.name.includes(word)) {
      score += 10;
    }

    if (fields.sku.includes(word)) {
      score += 14;
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

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string; q?: string; sort?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const isAll = slug === "all";
  const catalog = await getCatalogCategoryPage(slug);
  const { category, products: categoryProducts } = catalog.data;
  const searchQuery = (query?.q ?? "").trim();
  const searchText = searchQuery.toLowerCase();
  const selectedSort = sortOptions.some((option) => option.value === query?.sort) ? query?.sort ?? "popular" : "popular";
  const compareProducts = (a: (typeof categoryProducts)[number], b: (typeof categoryProducts)[number]) => {
      if (selectedSort === "latest") {
        return getProductCreatedTime(b) - getProductCreatedTime(a) || b.slug.localeCompare(a.slug);
      }

      if (selectedSort === "price-low") {
        return getLowestPrice(a) - getLowestPrice(b);
      }

      if (selectedSort === "price-high") {
        return getHighestPrice(b) - getHighestPrice(a);
      }

      return (b.sold ?? 0) - (a.sold ?? 0);
  };
  const visibleProducts = searchText
    ? categoryProducts
        .map((product) => ({ product, score: productSearchScore(product, searchText) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || compareProducts(a.product, b.product))
        .map((item) => item.product)
    : [...categoryProducts].sort(compareProducts);
  const recommendedProducts = searchText && !visibleProducts.length
    ? [...categoryProducts].sort((a, b) => compareProducts(a, b)).slice(0, 8)
    : [];
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
  const requestedPage = Number(query?.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(1, Math.floor(requestedPage)), totalPages) : 1;
  const paginatedProducts = visibleProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageHref = (page: number) => {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set("q", searchQuery);
    }

    if (selectedSort !== "popular") {
      params.set("sort", selectedSort);
    }

    if (page > 1) {
      params.set("page", String(page));
    }

    const suffix = params.toString();
    return suffix ? `/category/${slug}?${suffix}` : `/category/${slug}`;
  };
  const sortHref = (sort: string) => {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set("q", searchQuery);
    }

    if (sort !== "popular") {
      params.set("sort", sort);
    }

    const suffix = params.toString();
    return suffix ? `/category/${slug}?${suffix}` : `/category/${slug}`;
  };

  const title = searchQuery ? `Search: ${searchQuery}` : isAll ? "All Wholesale Products" : category?.name ?? "Products";
  const description = isAll
    ? "Browse public B2B prices, MOQ, stock status, and tier pricing across the full catalog."
    : category?.description;

  if (!isAll && !category) {
    return (
      <>
        <SiteHeader />
        <DataSourceNotice message={catalog.message} />
        <MarketplaceShell>
          <Container className="py-10">
            <div className="mx-auto max-w-2xl rounded-sm border border-zinc-200 bg-white p-8 text-center shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Category unavailable</p>
              <h1 className="mt-3 text-3xl font-black text-zinc-950">This category is not available yet</h1>
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                This category may be hidden, inactive, or not synced yet. Please browse all current wholesale products.
              </p>
              <Link
                href="/category/all"
                className="mt-6 inline-flex rounded-sm bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-orange-700"
              >
                Browse All Products
              </Link>
            </div>
          </Container>
        </MarketplaceShell>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      {searchQuery ? <SearchEventTracker query={searchQuery} resultCount={visibleProducts.length} categorySlug={slug} /> : null}
      <DataSourceNotice message={catalog.message} />
      <MarketplaceShell>
        <section className="border-b border-orange-100 bg-white">
          <Container className="py-2 sm:py-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="hidden text-[11px] font-black uppercase tracking-[0.18em] text-orange-600 sm:block sm:text-xs">Product Listing</p>
                <h1 className="text-base font-black tracking-tight text-zinc-950 sm:mt-1 sm:text-2xl">{title}</h1>
                <p className="mt-2 hidden max-w-3xl text-sm leading-6 text-zinc-600 sm:block">
                  {searchQuery ? `Showing products matching "${searchQuery}" by name, SKU, category, brand, model, or fitment.` : description}
                </p>
                {searchQuery ? (
                  <div className="mt-2 flex items-center gap-2 sm:hidden">
                    <span className="truncate rounded-sm bg-orange-50 px-2 py-1 text-[11px] font-black text-orange-700">
                      Search: {searchQuery}
                    </span>
                    <Link href="/category/all" className="shrink-0 text-[11px] font-black text-zinc-600">
                      Clear
                    </Link>
                  </div>
                ) : null}
              </div>
              <div className="w-fit rounded-sm bg-orange-50 px-2 py-1 text-[11px] font-black text-orange-700 ring-1 ring-orange-200 sm:px-3 sm:py-2 sm:text-xs">
                {visibleProducts.length} products / Public wholesale prices
              </div>
            </div>
          </Container>
        </section>

        <Container className="px-1.5 py-2 sm:px-6 sm:py-4 lg:px-8">
            <div className="mb-2 flex flex-col gap-2 rounded-sm border border-zinc-200 bg-white p-1.5 shadow-sm sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex snap-x gap-1 overflow-x-auto text-[11px] font-black [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:gap-2 sm:text-sm [&::-webkit-scrollbar]:hidden">
                {sortOptions.map((item) => (
                  <Link key={item.value} href={sortHref(item.value)} className={`shrink-0 snap-start rounded-sm px-2 py-1.5 sm:px-3 sm:py-2 ${selectedSort === item.value ? "bg-[#f65f18] text-white" : "bg-zinc-100 text-zinc-700 hover:bg-orange-50 hover:text-orange-700"}`}>
                    <span className="sm:hidden">{item.shortLabel}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                ))}
              </div>
              <Link href="/cart" className="hidden text-xs font-black text-orange-700 sm:block sm:text-sm">View Order List</Link>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:gap-3 md:grid-cols-4 xl:grid-cols-6">
              {paginatedProducts.map((product, index) => <ProductCard key={product.slug} product={product} priority={index < 2} />)}
            </div>

            {!paginatedProducts.length ? (
              <div className="rounded-sm border border-dashed border-orange-200 bg-white p-6 text-center sm:p-8">
                <p className="text-lg font-black text-zinc-950">No products found</p>
                <p className="mt-2 text-sm font-bold text-zinc-500">
                  Try a simpler keyword, SKU, model, category, or fitment. Example: brake, click, nmax, cable, oil.
                </p>
                <Link href="/category/all" className="mt-4 inline-flex rounded-sm bg-[#f65f18] px-4 py-2 text-sm font-black text-white">
                  View All Products
                </Link>
              </div>
            ) : null}

            {recommendedProducts.length ? (
              <section className="mt-5 rounded-sm border border-orange-100 bg-white p-3 shadow-sm sm:p-5">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-600">Recommended</p>
                    <h2 className="text-base font-black text-zinc-950 sm:text-xl">Popular products you may need</h2>
                  </div>
                  <Link href="/category/all" className="shrink-0 text-xs font-black text-orange-700 sm:text-sm">View all</Link>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                  {recommendedProducts.map((product) => <ProductCard key={product.slug} product={product} />)}
                </div>
              </section>
            ) : null}

            {totalPages > 1 ? (
              <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-1.5 pb-2 sm:gap-2">
                <Link
                  href={pageHref(Math.max(1, currentPage - 1))}
                  aria-disabled={currentPage === 1}
                  className={`grid h-10 min-w-10 place-items-center rounded-sm px-3 text-sm font-black sm:h-11 sm:min-w-11 ${
                    currentPage === 1
                      ? "pointer-events-none border border-zinc-100 bg-zinc-50 text-zinc-300"
                      : "border border-zinc-200 bg-white text-zinc-700"
                  }`}
                >
                  Prev
                </Link>
                {getPaginationItems(currentPage, totalPages).map((page, index) =>
                  page === "ellipsis" ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="grid h-10 w-7 place-items-center text-sm font-black text-zinc-400 sm:h-11"
                    >
                      ...
                    </span>
                  ) : (
                    <Link
                      key={page}
                      href={pageHref(page)}
                      aria-current={page === currentPage ? "page" : undefined}
                      className={`grid h-10 w-10 place-items-center rounded-sm text-sm font-black sm:h-11 sm:w-11 sm:text-base ${
                        page === currentPage ? "bg-[#f65f18] text-white" : "border border-zinc-200 bg-white text-zinc-700"
                      }`}
                    >
                      {page}
                    </Link>
                  ),
                )}
                <Link
                  href={pageHref(Math.min(totalPages, currentPage + 1))}
                  aria-disabled={currentPage === totalPages}
                  className={`grid h-10 min-w-10 place-items-center rounded-sm px-3 text-sm font-black sm:h-11 sm:min-w-11 ${
                    currentPage === totalPages
                      ? "pointer-events-none border border-zinc-100 bg-zinc-50 text-zinc-300"
                      : "border border-zinc-200 bg-white text-zinc-700"
                  }`}
                >
                  Next
                </Link>
              </div>
            ) : null}
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
