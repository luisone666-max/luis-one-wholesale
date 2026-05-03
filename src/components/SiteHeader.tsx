import Link from "next/link";
import { getActiveCategories } from "@/lib/mock-data";

export function SiteHeader() {
  const categories = getActiveCategories();

  return (
    <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/95 backdrop-blur">
      <div className="bg-[#f65f18] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs sm:px-6 lg:px-8">
          <p className="font-medium">Wholesale prices are public. Login is only needed when placing orders.</p>
          <div className="hidden items-center gap-5 md:flex">
            <span>Supplier Center</span>
            <span>Bulk Inquiry</span>
            <span>English</span>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-[#f65f18] text-xl font-black text-white">
                W
              </span>
              <span>
                <span className="block text-xl font-black tracking-tight text-zinc-950">WholesaleHub</span>
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
                  B2B Marketplace
                </span>
              </span>
            </Link>
            <Link
              href="/cart"
              className="rounded-md border border-orange-200 px-4 py-2 text-sm font-bold text-orange-700 lg:hidden"
            >
              Order Cart
            </Link>
          </div>

          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 overflow-hidden rounded-md border-2 border-[#f65f18] bg-white">
              <input
                aria-label="Search products"
                placeholder="Search wholesale products, SKU, category"
                className="min-w-0 flex-1 px-4 py-3 text-sm text-zinc-800 outline-none"
              />
              <Link
                href="/category/motorcycle-parts"
                className="bg-[#f65f18] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#df4f0d]"
              >
                Search
              </Link>
            </div>
            <nav className="flex items-center gap-3 text-sm font-semibold text-zinc-700">
              <Link href="/login" className="hover:text-orange-600">
                Login
              </Link>
              <span className="text-zinc-300">|</span>
              <Link href="/register" className="hover:text-orange-600">
                Register
              </Link>
              <Link
                href="/cart"
                className="hidden rounded-md bg-orange-50 px-4 py-3 font-bold text-orange-700 ring-1 ring-orange-200 hover:bg-orange-100 lg:inline-flex"
              >
                Order Cart
              </Link>
            </nav>
          </div>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 text-sm font-semibold text-zinc-700">
          <Link href="/category/all" className="shrink-0 rounded-full bg-zinc-100 px-4 py-2 hover:bg-orange-50">
            All Products
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="shrink-0 rounded-full bg-zinc-100 px-4 py-2 hover:bg-orange-50 hover:text-orange-700"
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
