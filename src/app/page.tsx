import Link from "next/link";
import { FacebookIcon, MessengerIcon } from "@/components/BrandActionIcons";
import { Container, MarketplaceShell } from "@/components/CustomerUi";
import { DataSourceNotice } from "@/components/DataSourceNotice";
import { HorizontalScrollRail } from "@/components/HorizontalScrollRail";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderServer as SiteHeader } from "@/components/SiteHeaderServer";
import { businessInfo } from "@/lib/business-info";
import { getCatalogCategoryListingPage, getCatalogNavigationCategories } from "@/lib/catalog-data";
import { popularCatalogSearches } from "@/lib/catalog-search-suggestions";

export const revalidate = 600;

export default async function Home() {
  const catalog = await getCatalogCategoryListingPage("all", { page: 1, pageSize: 36, sort: "popular" });
  const navigationCategories = await getCatalogNavigationCategories();
  const visibleProducts = catalog.data.products;
  const hasMoreProducts = catalog.data.totalProducts > catalog.data.pageSize;

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

        <Container className="!px-1.5 py-2 sm:!px-6 sm:py-4 lg:!px-8">
          {navigationCategories.length ? (
            <section className="mb-2 rounded-sm border border-zinc-200 bg-white p-1.5 shadow-sm sm:mb-4 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-3 px-1 sm:px-0">
                <h2 className="text-xs font-black uppercase tracking-[0.16em] text-zinc-600 sm:text-sm">Shop by category</h2>
                <Link href="/category/all" className="shrink-0 text-xs font-black text-orange-700 sm:text-sm">All Products</Link>
              </div>
              <HorizontalScrollRail viewportClassName="gap-1.5 text-[11px] font-black sm:gap-2 sm:text-sm">
                {navigationCategories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    className="shrink-0 snap-start rounded-sm bg-zinc-100 px-2.5 py-1.5 text-zinc-800 hover:bg-orange-50 hover:text-orange-700 sm:px-3 sm:py-2"
                  >
                    {category.name}
                    {category.itemCount ? <span className="ml-1 text-zinc-500">{category.itemCount}</span> : null}
                  </Link>
                ))}
              </HorizontalScrollRail>
            </section>
          ) : null}

          <section className="mb-2 rounded-sm border border-zinc-200 bg-white p-1.5 shadow-sm sm:mb-4 sm:p-4">
            <div className="mb-2 flex items-center justify-between gap-3 px-1 sm:px-0">
              <h2 className="text-xs font-black uppercase tracking-[0.16em] text-zinc-600 sm:text-sm">Popular searches</h2>
              <Link href="/category/all?sort=latest" className="shrink-0 text-xs font-black text-orange-700 sm:text-sm">Latest Products</Link>
            </div>
            <HorizontalScrollRail viewportClassName="gap-1.5 text-[11px] font-black sm:gap-2 sm:text-sm">
              {popularCatalogSearches.map((term) => (
                <Link
                  key={term}
                  href={`/category/all?q=${encodeURIComponent(term)}`}
                  className="shrink-0 snap-start rounded-sm bg-orange-50 px-2.5 py-1.5 text-orange-700 hover:bg-orange-100 sm:px-3 sm:py-2"
                >
                  {term}
                </Link>
              ))}
            </HorizontalScrollRail>
          </section>

          <div className="mb-2 flex items-center justify-between rounded-sm border border-zinc-200 bg-white p-1.5 shadow-sm sm:mb-4 sm:p-4">
            <HorizontalScrollRail className="min-w-0 flex-1" viewportClassName="gap-1.5 text-xs font-black sm:gap-2 sm:text-sm">
              <Link href="/category/all" className="shrink-0 rounded-sm bg-[#f65f18] px-2.5 py-1.5 text-white sm:px-3 sm:py-2">
                Recommended
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
            </HorizontalScrollRail>
            <Link href="/cart" className="ml-2 shrink-0 text-xs font-black text-orange-700 sm:text-sm">Order List</Link>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:gap-3 md:grid-cols-4 xl:grid-cols-6">
            {visibleProducts.map((product, index) => <ProductCard key={product.slug} product={product} priority={index < 2} />)}
          </div>

          {!visibleProducts.length ? (
            <div className="rounded-sm border border-dashed border-orange-200 bg-white p-8 text-center">
              <p className="text-lg font-black text-zinc-950">{catalog.message ? "Catalog is refreshing" : "No products found"}</p>
              <p className="mt-2 text-sm font-bold text-zinc-500">
                {catalog.message ? "Please reload in a moment, or message us if you need product availability." : "Please check back soon for current wholesale products."}
              </p>
              <Link href={businessInfo.messengerUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-sm bg-[#f65f18] px-4 py-2 text-sm font-black text-white">
                <MessengerIcon className="h-4 w-4 shrink-0" />
                <span>Chat on Messenger</span>
              </Link>
            </div>
          ) : null}

          {hasMoreProducts ? (
            <div className="mt-7 flex justify-center">
              <Link href="/category/all?page=2" className="rounded-sm border border-orange-200 bg-white px-5 py-3 text-sm font-black text-orange-700 hover:bg-orange-50">
                View More Products
              </Link>
            </div>
          ) : null}

          <section className="mt-8 grid gap-3 rounded-sm border border-orange-100 bg-white p-4 shadow-sm md:grid-cols-[1.2fr_0.8fr] md:p-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">About Luis One Supply Hub</p>
              <h2 className="mt-2 text-xl font-black text-zinc-950 sm:text-2xl">Motorcycle helmets, accessories, and wholesale supplies in Manila</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">{businessInfo.description}</p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">{businessInfo.extendedDescription}</p>
              <p className="mt-3 text-sm font-bold leading-6 text-zinc-700">{businessInfo.serviceArea}</p>
            </div>
            <div className="rounded-sm bg-orange-50 p-4 text-sm font-bold text-zinc-700 ring-1 ring-orange-100">
              <p className="font-black text-zinc-950">Contact & Pick-up</p>
              <div className="mt-3 space-y-2">
                <p>{businessInfo.address}</p>
                <a href={`tel:${businessInfo.phoneTel}`} className="block text-orange-700">{businessInfo.phoneDisplay}</a>
                <p>{businessInfo.hours}</p>
                <a href={businessInfo.facebookUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-orange-700">
                  <FacebookIcon className="h-4 w-4 shrink-0" />
                  <span>Facebook: Luis One Supply Hub</span>
                </a>
              </div>
            </div>
          </section>
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
