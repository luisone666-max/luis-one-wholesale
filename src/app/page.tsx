import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { categories, products } from "@/lib/mock-data";

const rules = [
  "Public product prices before login",
  "Tier pricing by quantity: 1-5, 6-11, 12-49, 50+ pcs",
  "No online payment in this mockup",
  "Shipping and confirmation are handled manually later",
];

export default function Home() {
  const bestSellers = [...products].sort((a, b) => b.sold - a.sold).slice(0, 4);

  return (
    <>
      <SiteHeader />
      <main className="bg-zinc-50">
        <section className="border-b border-orange-100 bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
            <div className="overflow-hidden rounded-md bg-[#f65f18] text-white">
              <div className="grid min-h-[340px] gap-6 p-8 md:grid-cols-[1fr_320px] md:items-center lg:p-10">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-100">B2B wholesale marketplace</p>
                  <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
                    Browse public wholesale prices before you login.
                  </h1>
                  <p className="mt-4 max-w-xl text-base leading-7 text-orange-50">
                    Source motorcycle parts, workshop supplies, grocery items, and phone accessories with clean MOQ,
                    stock, and quantity tier pricing.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href="/category/all"
                      className="rounded-md bg-white px-6 py-3 text-sm font-black text-[#f65f18] shadow-sm"
                    >
                      Browse Products
                    </Link>
                    <Link
                      href="/cart"
                      className="rounded-md border border-white/60 px-6 py-3 text-sm font-black text-white"
                    >
                      View Order Cart
                    </Link>
                  </div>
                </div>
                <div className="rounded-md bg-white/12 p-4 ring-1 ring-white/30">
                  <div className="grid grid-cols-2 gap-3">
                    {products.slice(0, 4).map((product) => (
                      <div key={product.slug} className="rounded-md bg-white p-3">
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={240}
                          height={240}
                          className="aspect-square w-full object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <aside className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-orange-600">Buyer snapshot</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-md bg-orange-50 p-4">
                  <p className="text-3xl font-black text-[#f65f18]">{products.length}</p>
                  <p className="text-sm font-bold text-zinc-700">Mock wholesale SKUs</p>
                </div>
                <div className="rounded-md bg-zinc-50 p-4">
                  <p className="text-3xl font-black text-zinc-950">4</p>
                  <p className="text-sm font-bold text-zinc-700">Price tiers per product</p>
                </div>
                <div className="rounded-md bg-zinc-50 p-4">
                  <p className="text-3xl font-black text-zinc-950">0</p>
                  <p className="text-sm font-bold text-zinc-700">Database or payment connection</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Shop by category" title="Wholesale categories" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md"
              >
                <span className="grid h-12 w-12 place-items-center rounded-md bg-orange-50 text-lg font-black text-[#f65f18]">
                  {category.name.slice(0, 2)}
                </span>
                <h3 className="mt-4 text-lg font-black text-zinc-950">{category.name}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-600">{category.description}</p>
                <p className="mt-4 text-sm font-bold text-orange-700">{category.itemCount} products</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Best sellers"
            title="Fast-moving wholesale items"
            action={
              <Link href="/category/all" className="hidden text-sm font-black text-orange-700 hover:text-orange-800 sm:block">
                View all
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>

        <section className="border-y border-orange-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
            <SectionHeader eyebrow="Wholesale rules" title="Clear buying terms for this mockup" />
            <div className="grid gap-4 md:grid-cols-4">
              {rules.map((rule, index) => (
                <div key={rule} className="rounded-md bg-zinc-50 p-5 ring-1 ring-zinc-200">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-[#f65f18] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="mt-4 text-sm font-bold leading-6 text-zinc-800">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
