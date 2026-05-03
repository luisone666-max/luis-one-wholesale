import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, MarketplaceShell, ProductFilters } from "@/components/CustomerUi";
import { DataSourceNotice } from "@/components/DataSourceNotice";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCatalogCategoryPage, getCatalogCategoryParams } from "@/lib/catalog-data";

export async function generateStaticParams() {
  return getCatalogCategoryParams();
}

const pageSize = 12;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string; q?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const isAll = slug === "all";
  const catalog = await getCatalogCategoryPage(slug);
  const { categories, category, products: categoryProducts } = catalog.data;
  const searchQuery = (query?.q ?? "").trim();
  const searchText = searchQuery.toLowerCase();
  const visibleProducts = searchText
    ? categoryProducts.filter((product) =>
        [product.name, product.sku ?? "", product.category, product.description]
          .join(" ")
          .toLowerCase()
          .includes(searchText),
      )
    : categoryProducts;
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
  const requestedPage = Number(query?.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(1, Math.floor(requestedPage)), totalPages) : 1;
  const paginatedProducts = visibleProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageHref = (page: number) => {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set("q", searchQuery);
    }

    if (page > 1) {
      params.set("page", String(page));
    }

    const suffix = params.toString();
    return suffix ? `/category/${slug}?${suffix}` : `/category/${slug}`;
  };

  if (!isAll && !category) {
    notFound();
  }

  const title = searchQuery ? `Search: ${searchQuery}` : isAll ? "All Wholesale Products" : category?.name ?? "Products";
  const description = isAll
    ? "Browse public B2B prices, MOQ, stock status, and tier pricing across the full catalog."
    : category?.description;

  return (
    <>
      <SiteHeader />
      <DataSourceNotice message={catalog.message} />
      <MarketplaceShell>
        <section className="border-b border-orange-100 bg-white">
          <Container className="py-3 sm:py-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600 sm:text-sm">Product Listing</p>
                <h1 className="mt-1 text-xl font-black tracking-tight text-zinc-950 sm:mt-2 sm:text-3xl">{title}</h1>
                <p className="mt-2 hidden max-w-3xl text-sm leading-6 text-zinc-600 sm:block">{description}</p>
              </div>
              <div className="w-fit rounded-sm bg-orange-50 px-3 py-2 text-xs font-black text-orange-700 ring-1 ring-orange-200 sm:px-4 sm:py-3 sm:text-sm">
                {visibleProducts.length} products / Public wholesale prices
              </div>
            </div>
          </Container>
        </section>

        <Container className="grid gap-3 py-3 sm:gap-6 sm:py-6 lg:grid-cols-[260px_1fr]">
          <div className="lg:hidden">
            <details className="rounded-sm border border-zinc-200 bg-white p-4 shadow-sm">
              <summary className="cursor-pointer text-sm font-black text-zinc-950">Open filters</summary>
              <div className="mt-4">
                <ProductFilters categories={categories} activeSlug={slug} />
              </div>
            </details>
          </div>
          <div className="hidden lg:block">
            <ProductFilters categories={categories} activeSlug={slug} />
          </div>

          <div>
            <div className="mb-3 flex flex-col gap-2 rounded-sm border border-zinc-200 bg-white p-2 shadow-sm sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex gap-1.5 overflow-x-auto text-xs font-black sm:flex-wrap sm:gap-2 sm:text-sm">
                {["Popular", "Latest", "Price Low to High", "Price High to Low"].map((item, index) => (
                  <button key={item} type="button" className={`shrink-0 rounded-sm px-2.5 py-1.5 sm:px-3 sm:py-2 ${index === 0 ? "bg-[#f65f18] text-white" : "bg-zinc-100 text-zinc-700"}`}>
                    {item}
                  </button>
                ))}
              </div>
              <Link href="/cart" className="text-xs font-black text-orange-700 sm:text-sm">View Order List</Link>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
              {paginatedProducts.map((product) => <ProductCard key={product.slug} product={product} />)}
            </div>

            {!paginatedProducts.length ? (
              <div className="rounded-sm border border-dashed border-orange-200 bg-white p-8 text-center">
                <p className="text-lg font-black text-zinc-950">No products found</p>
                <p className="mt-2 text-sm font-bold text-zinc-500">Try another product name, SKU, or category keyword.</p>
                <Link href="/category/all" className="mt-4 inline-flex rounded-sm bg-[#f65f18] px-4 py-2 text-sm font-black text-white">
                  View All Products
                </Link>
              </div>
            ) : null}

            {totalPages > 1 ? (
              <div className="mt-7 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <Link
                    key={page}
                    href={pageHref(page)}
                    className={`grid h-10 w-10 place-items-center rounded-sm text-sm font-black ${
                      page === currentPage ? "bg-[#f65f18] text-white" : "border border-zinc-200 bg-white text-zinc-700"
                    }`}
                  >
                    {page}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
