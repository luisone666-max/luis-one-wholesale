import Link from "next/link";
import type { Metadata } from "next";
import { Container, MarketplaceShell } from "@/components/CustomerUi";
import { DataSourceNotice } from "@/components/DataSourceNotice";
import { ProductCard } from "@/components/ProductCard";
import { SearchEventTracker } from "@/components/SearchEventTracker";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderServer as SiteHeader } from "@/components/SiteHeaderServer";
import { getCatalogCategoryListingPage, getCatalogCategoryPage, getCatalogCategoryParams, type CatalogListingSort } from "@/lib/catalog-data";
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
  const { category, products: paginatedProducts, totalProducts, totalPages, currentPage } = catalog.data;
  const recommendedCatalog =
    searchQuery && totalProducts === 0
      ? await getCatalogCategoryListingPage(slug, { page: 1, pageSize: 8, sort: selectedSort })
      : null;
  const recommendedProducts = recommendedCatalog?.data.products ?? [];
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
                    <Link href="/category/all" className="shrink-0 text-[11px] font-black text-zinc-600">
                      Clear
                    </Link>
                  </div>
                ) : null}
              </div>
              <div className="w-fit rounded-sm bg-orange-50 px-2 py-1 text-[11px] font-black text-orange-700 ring-1 ring-orange-200 sm:px-3 sm:py-2 sm:text-xs">
                {totalProducts} products / Public wholesale prices
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
