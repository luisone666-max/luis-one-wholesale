import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, MarketplaceShell, PriceTierTable, ProductImage, StockStatusBadge } from "@/components/CustomerUi";
import { DataSourceNotice } from "@/components/DataSourceNotice";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailActions } from "@/components/ProductDetailActions";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCatalogProductPage, getCatalogProductParams } from "@/lib/catalog-data";
import { getPriceRange } from "@/lib/mock-data";

export async function generateStaticParams() {
  return getCatalogProductParams();
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogProductPage(slug);
  const { product, related } = catalog.data;

  if (!product) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <DataSourceNotice message={catalog.message} />
      <MarketplaceShell>
        <Container className="py-6">
          <div className="mb-4 text-sm font-bold text-zinc-500">
            <Link href="/" className="hover:text-orange-700">Home</Link> /{" "}
            <Link href={`/category/${product.categorySlug}`} className="hover:text-orange-700">{product.category}</Link> /{" "}
            <span className="text-zinc-900">{product.name}</span>
          </div>

          <section className="grid gap-6 rounded-sm border border-zinc-200 bg-white p-4 shadow-sm lg:grid-cols-[460px_1fr_330px]">
            <div>
              <div className="aspect-square rounded-sm bg-gradient-to-br from-orange-50 via-white to-zinc-50 p-6 ring-1 ring-orange-100">
                <ProductImage src={product.image} alt={product.name} />
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {product.gallery.slice(0, 5).map((image) => (
                  <div key={image} className="aspect-square rounded-sm border border-zinc-200 bg-white p-2">
                    <ProductImage src={image} alt={`${product.name} view`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm bg-orange-50 px-2 py-1 text-xs font-black text-orange-700 ring-1 ring-orange-100">Wholesale</span>
                <StockStatusBadge status={product.stockStatus} />
              </div>
              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-zinc-950">{product.name}</h1>
              <p className="mt-3 text-3xl font-black text-[#f65f18]">{getPriceRange(product)}</p>
              <div className="mt-4 grid gap-3 text-sm font-bold text-zinc-600 sm:grid-cols-2">
                <Info label="SKU" value={product.sku ?? "-"} />
                <Info label="MOQ" value={`${product.moq} pc`} />
                <Info label="Stock Status" value={product.stockStatus === "Preorder" ? "For Order" : product.stockStatus === "In stock" ? "Ready Stock" : product.stockStatus} />
                <Info label="Lead Time" value={product.stockStatus === "Preorder" ? "To be confirmed" : "Ready for confirmation"} />
              </div>
              <div className="mt-5">
                <h2 className="mb-3 text-lg font-black text-zinc-950">Wholesale Price Table</h2>
                <PriceTierTable tiers={product.tiers} />
              </div>
            </div>

            <ProductDetailActions product={product} />
          </section>

          <section className="mt-6 rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-zinc-950">Product Description</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600">{product.description}</p>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-zinc-600 sm:grid-cols-2">
              {product.details.map((detail) => <li key={detail} className="rounded-sm bg-zinc-50 px-3 py-2">- {detail}</li>)}
            </ul>
          </section>

          {related.length ? (
            <section className="mt-8">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Related Products</p>
                  <h2 className="mt-1 text-2xl font-black text-zinc-950">More wholesale items</h2>
                </div>
                <Link href={`/category/${product.categorySlug}`} className="text-sm font-black text-orange-700">View category</Link>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {related.map((item) => <ProductCard key={item.slug} product={item} />)}
              </div>
            </section>
          ) : null}
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-zinc-50 p-3 ring-1 ring-zinc-100">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-1 font-black text-zinc-950">{value}</p>
    </div>
  );
}
