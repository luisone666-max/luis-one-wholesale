import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { categories, getCategoryBySlug, getProductsByCategory, products } from "@/lib/mock-data";

export function generateStaticParams() {
  return [{ slug: "all" }, ...categories.map((category) => ({ slug: category.slug }))];
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const isAll = slug === "all";
  const category = isAll ? null : getCategoryBySlug(slug);

  if (!isAll && !category) {
    notFound();
  }

  const visibleProducts = isAll ? products : getProductsByCategory(slug);
  const title = isAll ? "All Wholesale Products" : category?.name ?? "Products";
  const description = isAll
    ? "Browse the full mock catalog with public B2B tier pricing, MOQ, stock, and product details."
    : category?.description;

  return (
    <>
      <SiteHeader />
      <main className="bg-zinc-50">
        <section className="border-b border-orange-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Product listing</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">{description}</p>
              </div>
              <div className="rounded-md bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700 ring-1 ring-orange-200">
                {visibleProducts.length} products · Public prices
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
          <aside className="h-fit rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-base font-black text-zinc-950">Filters</p>
            <div className="mt-5 space-y-6">
              <div>
                <p className="text-sm font-bold text-zinc-800">Category</p>
                <div className="mt-3 space-y-2 text-sm text-zinc-600">
                  <Link href="/category/all" className={`block hover:text-orange-700 ${isAll ? "font-black text-orange-700" : ""}`}>
                    All Products
                  </Link>
                  {categories.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/category/${item.slug}`}
                      className={`block hover:text-orange-700 ${slug === item.slug ? "font-black text-orange-700" : ""}`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-800">Stock status</p>
                <label className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#f65f18]" /> In stock
                </label>
                <label className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
                  <input type="checkbox" className="h-4 w-4 accent-[#f65f18]" /> Low stock
                </label>
                <label className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
                  <input type="checkbox" className="h-4 w-4 accent-[#f65f18]" /> Preorder
                </label>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-800">Wholesale tier</p>
                <select className="mt-3 h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-orange-500">
                  <option>Show all tiers</option>
                  <option>50+ pcs available</option>
                  <option>12-49 pcs available</option>
                </select>
              </div>
              <button className="h-11 w-full rounded-md bg-zinc-950 text-sm font-black text-white" type="button">
                Apply Filters
              </button>
            </div>
          </aside>

          <div>
            <div className="mb-4 flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-zinc-700">Sort by: Best Match · Top Sales · Latest Stock</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-zinc-500">Page</span>
                <button className="h-9 rounded-md border border-zinc-200 px-3 font-bold text-zinc-400" type="button">
                  Previous
                </button>
                <span className="font-black text-orange-700">1 / 3</span>
                <button className="h-9 rounded-md border border-orange-200 px-3 font-bold text-orange-700" type="button">
                  Next
                </button>
              </div>
            </div>

            <SectionHeader title="Available products" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>

            <div className="mt-7 flex justify-center gap-2">
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`h-10 w-10 rounded-md text-sm font-black ${
                    page === 1 ? "bg-[#f65f18] text-white" : "border border-zinc-200 bg-white text-zinc-700"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
