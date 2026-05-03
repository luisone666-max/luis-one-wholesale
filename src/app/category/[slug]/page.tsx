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

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const isAll = slug === "all";
  const catalog = await getCatalogCategoryPage(slug);
  const { categories, category, products: visibleProducts } = catalog.data;

  if (!isAll && !category) {
    notFound();
  }

  const title = isAll ? "All Wholesale Products" : category?.name ?? "Products";
  const description = isAll
    ? "Browse public B2B prices, MOQ, stock status, and tier pricing across the full catalog."
    : category?.description;

  return (
    <>
      <SiteHeader />
      <DataSourceNotice message={catalog.message} />
      <MarketplaceShell>
        <section className="border-b border-orange-100 bg-white">
          <Container className="py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Product Listing</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">{description}</p>
              </div>
              <div className="rounded-sm bg-orange-50 px-4 py-3 text-sm font-black text-orange-700 ring-1 ring-orange-200">
                {visibleProducts.length} products / Public wholesale prices
              </div>
            </div>
          </Container>
        </section>

        <Container className="grid gap-6 py-6 lg:grid-cols-[260px_1fr]">
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
            <div className="mb-4 flex flex-col gap-3 rounded-sm border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2 text-sm font-black">
                {["Popular", "Latest", "Price Low to High", "Price High to Low"].map((item, index) => (
                  <button key={item} type="button" className={`rounded-sm px-3 py-2 ${index === 0 ? "bg-[#f65f18] text-white" : "bg-zinc-100 text-zinc-700"}`}>
                    {item}
                  </button>
                ))}
              </div>
              <Link href="/cart" className="text-sm font-black text-orange-700">View Order List</Link>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product) => <ProductCard key={product.slug} product={product} />)}
            </div>

            <div className="mt-7 flex justify-center gap-2">
              {[1, 2, 3].map((page) => (
                <button key={page} type="button" className={`h-10 w-10 rounded-sm text-sm font-black ${page === 1 ? "bg-[#f65f18] text-white" : "border border-zinc-200 bg-white text-zinc-700"}`}>
                  {page}
                </button>
              ))}
            </div>
          </div>
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
