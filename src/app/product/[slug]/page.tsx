import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataSourceNotice } from "@/components/DataSourceNotice";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailActions } from "@/components/ProductDetailActions";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCatalogProductPage, getCatalogProductParams } from "@/lib/catalog-data";
import { formatMoney } from "@/lib/mock-data";

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
      <main className="bg-zinc-50">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4 text-sm font-semibold text-zinc-500">
            <Link href="/" className="hover:text-orange-700">
              Home
            </Link>{" "}
            /{" "}
            <Link href={`/category/${product.categorySlug}`} className="hover:text-orange-700">
              {product.category}
            </Link>{" "}
            / <span className="text-zinc-900">{product.name}</span>
          </div>

          <div className="grid gap-6 rounded-md border border-zinc-200 bg-white p-5 shadow-sm lg:grid-cols-[520px_1fr]">
            <div>
              <div className="rounded-md bg-orange-50 p-6">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={640}
                  height={640}
                  priority
                  className="aspect-square w-full object-contain"
                />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {product.gallery.map((image) => (
                  <div key={image} className="rounded-md border border-orange-100 bg-white p-2">
                    <Image
                      src={image}
                      alt={`${product.name} view`}
                      width={160}
                      height={160}
                      className="aspect-square w-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="border-b border-zinc-100 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-orange-50 px-2 py-1 text-xs font-black text-orange-700">Wholesale</span>
                  <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-600">{product.stockStatus}</span>
                </div>
                <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-zinc-950">{product.name}</h1>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{product.description}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-zinc-600">
                  <span>Rating {product.rating}/5</span>
                  <span>{product.sold.toLocaleString()} sold</span>
                  <span>{product.stockCount.toLocaleString()} pcs stock</span>
                  <span>MOQ {product.moq} pc</span>
                </div>
              </div>

              <div className="grid gap-6 py-5 lg:grid-cols-[1fr_320px]">
                <div>
                  <h2 className="text-lg font-black text-zinc-950">Wholesale price table</h2>
                  <div className="mt-3 overflow-hidden rounded-md border border-zinc-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                        <tr>
                          <th className="px-4 py-3">Quantity</th>
                          <th className="px-4 py-3">Unit price</th>
                          <th className="px-4 py-3">Hint</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {product.tiers.map((tier) => (
                          <tr key={tier.label}>
                            <td className="px-4 py-4 font-black text-zinc-900">{tier.label}</td>
                            <td className="px-4 py-4 font-black text-[#f65f18]">{formatMoney(tier.price)}</td>
                            <td className="px-4 py-4 text-zinc-600">
                              {tier.max === null ? "Best bulk tier" : `Applies from ${tier.min} pcs`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 rounded-md bg-zinc-50 p-5 ring-1 ring-zinc-200">
                    <h2 className="text-lg font-black text-zinc-950">Product details</h2>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
                      {product.details.map((detail) => (
                        <li key={detail}>- {detail}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <ProductDetailActions product={product} />
              </div>
            </div>
          </div>

          {related.length ? (
            <section className="mt-8">
              <h2 className="mb-4 text-2xl font-black text-zinc-950">Related wholesale items</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <ProductCard key={item.slug} product={item} />
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
