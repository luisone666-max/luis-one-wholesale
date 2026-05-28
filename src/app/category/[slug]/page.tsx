import Link from "next/link";
import type { Metadata } from "next";
import { SearchIcon } from "@/components/BrandActionIcons";
import { Container, MarketplaceShell } from "@/components/CustomerUi";
import { DataSourceNotice } from "@/components/DataSourceNotice";
import { HorizontalScrollRail } from "@/components/HorizontalScrollRail";
import { ProductCard } from "@/components/ProductCard";
import { SearchEventTracker } from "@/components/SearchEventTracker";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderServer as SiteHeader } from "@/components/SiteHeaderServer";
import { getCatalogCategoryListingPage, getCatalogCategoryPage, getCatalogCategoryParams, getCatalogNavigationCategories, type CatalogListingSort } from "@/lib/catalog-data";
import { popularCatalogSearches } from "@/lib/catalog-search-suggestions";
import { categoryDescription, getSiteUrl, optimizedPublicImageUrl, siteName } from "@/lib/seo";

export const revalidate = 600;

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
  const image = optimizedPublicImageUrl(category?.image ?? "/brand/luis-one-logo.jpg");

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

const pageSize = 36;
const sortOptions = [
  { label: "Recommended", shortLabel: "Recommended", value: "popular" },
  { label: "Latest", shortLabel: "Latest", value: "latest" },
  { label: "Price Low to High", shortLabel: "Low Price", value: "price-low" },
  { label: "Price High to Low", shortLabel: "High Price", value: "price-high" },
] satisfies Array<{ label: string; shortLabel: string; value: CatalogListingSort }>;

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
  const searchQuery = (query?.q ?? "").trim();
  const requestedPage = Number(query?.page ?? "1");
  const selectedSort = sortOptions.some((option) => option.value === query?.sort) ? (query?.sort as CatalogListingSort) : "popular";
  const catalog = await getCatalogCategoryListingPage(slug, {
    page: Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1,
    pageSize,
    query: searchQuery,
    sort: selectedSort,
  });
  const navigationCategories = await getCatalogNavigationCategories();
  const { category, products: paginatedProducts, totalProducts, totalPages, currentPage } = catalog.data;
  const recommendedCatalog =
    searchQuery && totalProducts === 0
      ? await getCatalogCategoryListingPage(slug, { page: 1, pageSize: 8, sort: selectedSort })
      : null;
  const recommendedProducts = recommendedCatalog?.data.products ?? [];
  const subcategoryChips = isAll
    ? []
    : catalog.data.categories.filter((item) => item.parentSlug === slug && item.active);
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
  const categoryHref = (categorySlug: string) => {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set("q", searchQuery);
    }

    if (selectedSort !== "popular") {
      params.set("sort", selectedSort);
    }

    const suffix = params.toString();
    return suffix ? `/category/${categorySlug}?${suffix}` : `/category/${categorySlug}`;
  };
  const clearSearchHref = () => {
    const params = new URLSearchParams();

    if (selectedSort !== "popular") {
      params.set("sort", selectedSort);
    }

    const suffix = params.toString();
    return suffix ? `/category/${slug}?${suffix}` : `/category/${slug}`;
  };
  const clearSortHref = () => {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set("q", searchQuery);
    }

    const suffix = params.toString();
    return suffix ? `/category/${slug}?${suffix}` : `/category/${slug}`;
  };
  const clearCategoryHref = () => {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set("q", searchQuery);
    }

    if (selectedSort !== "popular") {
      params.set("sort", selectedSort);
    }

    const suffix = params.toString();
    return suffix ? `/category/all?${suffix}` : "/category/all";
  };

  const title = searchQuery ? `Search: ${searchQuery}` : isAll ? "All Wholesale Products" : category?.name ?? "Products";
  const description = isAll
    ? "Browse public B2B prices, MOQ, stock status, and tier pricing across the full catalog."
    : category?.description;
  const selectedSortLabel = sortOptions.find((option) => option.value === selectedSort)?.label ?? "Recommended";
  const resultStart = totalProducts ? (currentPage - 1) * pageSize + 1 : 0;
  const resultEnd = totalProducts ? Math.min(currentPage * pageSize, totalProducts) : 0;

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
      {searchQuery ? <SearchEventTracker query={searchQuery} resultCount={totalProducts} categorySlug={slug} /> : null}
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
                    <Link href={clearSearchHref()} className="shrink-0 text-[11px] font-black text-zinc-600">
                      Clear
                    </Link>
                  </div>
                ) : null}
              </div>
              <div className="w-fit rounded-sm bg-orange-50 px-2 py-1 text-[11px] font-black text-orange-700 ring-1 ring-orange-200 sm:px-3 sm:py-2 sm:text-xs">
                {totalProducts ? `Showing ${resultStart}-${resultEnd} of ${totalProducts}` : "0 products"} / Public prices
              </div>
            </div>
          </Container>
        </section>

        <Container className="!px-1.5 py-2 sm:!px-6 sm:py-4 lg:!px-8">
          <div className="space-y-2 sm:space-y-4">
            {searchQuery || selectedSort !== "popular" ? (
            <section className="rounded-sm border border-orange-100 bg-white p-2 shadow-sm sm:p-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black sm:gap-2 sm:text-xs">
                    <span className="mr-1 text-zinc-500">Current view</span>
                    {!isAll && category ? (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-orange-50 px-2 py-1 text-orange-700">
                        Category: {category.name}
                        <Link href={clearCategoryHref()} className="text-orange-500 hover:text-orange-800" aria-label="Clear category filter">
                          X
                        </Link>
                      </span>
                    ) : null}
                    {searchQuery ? (
                      <span className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-sm bg-zinc-100 px-2 py-1 text-zinc-700">
                        <span className="truncate">Search: {searchQuery}</span>
                        <Link href={clearSearchHref()} className="text-zinc-500 hover:text-zinc-900" aria-label="Clear search filter">
                          X
                        </Link>
                      </span>
                    ) : null}
                    {selectedSort !== "popular" ? (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-zinc-100 px-2 py-1 text-zinc-700">
                        Sort: {selectedSortLabel}
                        <Link href={clearSortHref()} className="text-zinc-500 hover:text-zinc-900" aria-label="Clear sort filter">
                          X
                        </Link>
                      </span>
                    ) : null}
                    {isAll && !searchQuery && selectedSort === "popular" ? (
                      <span className="rounded-sm bg-emerald-50 px-2 py-1 text-emerald-700">All products / Recommended</span>
                    ) : (
                      <Link href="/category/all" className="rounded-sm border border-zinc-200 bg-white px-2 py-1 text-zinc-600 hover:border-orange-200 hover:text-orange-700">
                        Reset all
                      </Link>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] font-bold leading-5 text-zinc-500 sm:text-xs">
                    {totalProducts ? `Showing ${resultStart}-${resultEnd} of ${totalProducts} products.` : "No products match this view yet."} Tap a product to view pricing, options, and availability.
                  </p>
                </div>

                <form action={`/category/${slug}`} className="grid gap-1.5">
                  <label htmlFor="category-inline-search" className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500 sm:text-xs">
                    {isAll ? "Search All Products" : "Search In This Category"}
                  </label>
                  <div className="flex overflow-hidden rounded-sm border border-zinc-300 bg-white focus-within:border-[#f65f18]">
                    <input
                      id="category-inline-search"
                      type="search"
                      name="q"
                      required
                      defaultValue={searchQuery}
                      placeholder={isAll ? "Search SKU, model, or product" : `Search ${category?.name ?? "this category"}`}
                      className="min-w-0 flex-1 px-3 py-2 text-xs font-bold text-zinc-800 outline-none placeholder:text-zinc-400 sm:text-sm"
                    />
                    {selectedSort !== "popular" ? <input type="hidden" name="sort" value={selectedSort} /> : null}
                    <button
                      type="submit"
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 bg-[#f65f18] px-3 py-2 text-xs font-black text-white hover:bg-[#df4f0d] sm:px-4 sm:text-sm"
                    >
                      <SearchIcon className="h-4 w-4 shrink-0" />
                      <span>Search</span>
                    </button>
                  </div>
                  {searchQuery ? (
                    <Link href={clearSearchHref()} className="text-[11px] font-black text-zinc-500 hover:text-orange-700">
                      Clear search only
                    </Link>
                  ) : null}
                </form>
              </div>
            </section>
            ) : null}

            {navigationCategories.length ? (
              <section className="hidden rounded-sm border border-zinc-200 bg-white p-2 shadow-sm sm:p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500 sm:text-xs">Main Categories</p>
                  <Link href={categoryHref("all")} className="shrink-0 text-[11px] font-black text-orange-700 sm:text-xs">
                    Browse all
                  </Link>
                </div>
                <HorizontalScrollRail viewportClassName="gap-1.5 text-[11px] font-black sm:gap-2 sm:text-sm">
                <Link href={categoryHref("all")} className={`shrink-0 snap-start rounded-sm px-2.5 py-1.5 sm:px-3 sm:py-2 ${slug === "all" ? "bg-[#f65f18] text-white" : "bg-zinc-100 text-zinc-700 hover:bg-orange-50 hover:text-orange-700"}`}>
                  All Products
                </Link>
                {navigationCategories.map((item) => (
                  <Link
                    key={item.slug}
                    href={categoryHref(item.slug)}
                    className={`shrink-0 snap-start rounded-sm px-2.5 py-1.5 sm:px-3 sm:py-2 ${slug === item.slug ? "bg-[#f65f18] text-white" : "bg-zinc-100 text-zinc-700 hover:bg-orange-50 hover:text-orange-700"}`}
                  >
                    {item.name}
                    {item.itemCount ? <span className={slug === item.slug ? "ml-1 text-orange-50" : "ml-1 text-zinc-500"}>{item.itemCount}</span> : null}
                  </Link>
                ))}
                </HorizontalScrollRail>
              </section>
            ) : null}

            {subcategoryChips.length ? (
              <section className="rounded-sm border border-orange-100 bg-white p-2 shadow-sm sm:p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-600 sm:text-xs">Subcategories</p>
                  <span className="shrink-0 text-[11px] font-black text-zinc-400 sm:text-xs">{subcategoryChips.length} sections</span>
                </div>
                <HorizontalScrollRail viewportClassName="gap-1.5 text-[11px] font-black sm:gap-2 sm:text-sm">
                  {subcategoryChips.map((item) => (
                    <Link
                      key={item.slug}
                      href={categoryHref(item.slug)}
                      className="shrink-0 snap-start rounded-sm bg-orange-50 px-2.5 py-1.5 text-orange-700 hover:bg-orange-100 sm:px-3 sm:py-2"
                    >
                      {item.name}
                      {item.itemCount ? <span className="ml-1 text-orange-500">{item.itemCount}</span> : null}
                    </Link>
                  ))}
                </HorizontalScrollRail>
              </section>
            ) : null}

            <section className="hidden rounded-sm border border-zinc-200 bg-white p-2 shadow-sm sm:p-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="min-w-0">
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500 sm:text-xs">Popular Searches</p>
                  <HorizontalScrollRail viewportClassName="gap-1.5 text-[11px] font-black sm:gap-2 sm:text-sm">
                    {popularCatalogSearches.map((term) => (
                      <Link
                        key={term}
                        href={`/category/all?q=${encodeURIComponent(term)}`}
                        className={`shrink-0 snap-start rounded-sm px-2.5 py-1.5 sm:px-3 sm:py-2 ${searchQuery.toLowerCase() === term.toLowerCase() ? "bg-[#f65f18] text-white" : "bg-orange-50 text-orange-700 hover:bg-orange-100"}`}
                      >
                        {term}
                      </Link>
                    ))}
                  </HorizontalScrollRail>
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500 sm:text-xs">Sort By</p>
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-black sm:gap-2 sm:text-sm">
                    {sortOptions.map((item) => (
                      <Link key={item.value} href={sortHref(item.value)} className={`shrink-0 rounded-sm px-2 py-1.5 sm:px-3 sm:py-2 ${selectedSort === item.value ? "bg-[#f65f18] text-white" : "bg-zinc-100 text-zinc-700 hover:bg-orange-50 hover:text-orange-700"}`}>
                        <span className="sm:hidden">{item.shortLabel}</span>
                        <span className="hidden sm:inline">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3">
                <p className="text-[11px] font-bold leading-5 text-zinc-500 sm:text-xs">
                  Prices are public. Final availability, packing, and delivery are confirmed manually.
                </p>
                <Link href="/cart" className="shrink-0 text-xs font-black text-orange-700 sm:text-sm">View Order List</Link>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
          </div>
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
