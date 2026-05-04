import Link from "next/link";
import { Container, MarketplaceShell } from "@/components/CustomerUi";
import { DataSourceNotice } from "@/components/DataSourceNotice";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCatalogSnapshot } from "@/lib/catalog-data";

export const revalidate = 60;

export default async function Home() {
  const catalog = await getCatalogSnapshot();
  const products = [...catalog.data.products].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
  const visibleProducts = products.slice(0, 48);

  return (
    <>
      <SiteHeader />
      <DataSourceNotice message={catalog.message} />
      <MarketplaceShell>
        <section className="border-b border-orange-100 bg-white">
          <Container className="py-3 sm:py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-600 sm:text-xs">Luis One Supply Hub</p>
                <h1 className="mt-1 text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">
                  Wholesale Products
                </h1>
              </div>
              <div className="w-fit rounded-sm bg-orange-50 px-3 py-2 text-xs font-black text-orange-700 ring-1 ring-orange-200">
                Public prices / Manual order confirmation
              </div>
            </div>
          </Container>
        </section>

        <Container className="py-3 sm:py-4">
          <div className="mb-3 flex items-center justify-between rounded-sm border border-zinc-200 bg-white p-2 shadow-sm sm:mb-4 sm:p-4">
            <div className="flex gap-1.5 overflow-x-auto text-xs font-black sm:flex-wrap sm:gap-2 sm:text-sm">
              <Link href="/category/all" className="shrink-0 rounded-sm bg-[#f65f18] px-2.5 py-1.5 text-white sm:px-3 sm:py-2">
                Popular
              </Link>
              <Link href="/category/all?sort=latest" className="shrink-0 rounded-sm bg-zinc-100 px-2.5 py-1.5 text-zinc-700 hover:bg-orange-50 hover:text-orange-700 sm:px-3 sm:py-2">
                Latest
              </Link>
              <Link href="/category/all?sort=price-low" className="shrink-0 rounded-sm bg-zinc-100 px-2.5 py-1.5 text-zinc-700 hover:bg-orange-50 hover:text-orange-700 sm:px-3 sm:py-2">
                Price Low to High
              </Link>
              <Link href="/category/all?sort=price-high" className="shrink-0 rounded-sm bg-zinc-100 px-2.5 py-1.5 text-zinc-700 hover:bg-orange-50 hover:text-orange-700 sm:px-3 sm:py-2">
                Price High to Low
              </Link>
            </div>
            <Link href="/cart" className="ml-2 shrink-0 text-xs font-black text-orange-700 sm:text-sm">Order List</Link>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 xl:grid-cols-6">
            {visibleProducts.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>

          {!visibleProducts.length ? (
            <div className="rounded-sm border border-dashed border-orange-200 bg-white p-8 text-center">
              <p className="text-lg font-black text-zinc-950">No products found</p>
              <p className="mt-2 text-sm font-bold text-zinc-500">Add products in the admin dashboard to show them here.</p>
              <Link href="/admin/products" className="mt-4 inline-flex rounded-sm bg-[#f65f18] px-4 py-2 text-sm font-black text-white">
                Manage Products
              </Link>
            </div>
          ) : null}

          {products.length > 48 ? (
            <div className="mt-7 flex justify-center">
              <Link href="/category/all?page=2" className="rounded-sm border border-orange-200 bg-white px-5 py-3 text-sm font-black text-orange-700 hover:bg-orange-50">
                View More Products
              </Link>
            </div>
          ) : null}
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
