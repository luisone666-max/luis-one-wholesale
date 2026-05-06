"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerAuthNav } from "@/components/auth/CustomerAuthNav";
import { BrandLogo } from "@/components/BrandLogo";
import { CartIconLink } from "@/components/CartIconLink";
import { messengerUrl } from "@/components/CustomerUi";
import { ProductSearchForm } from "@/components/ProductSearchForm";
import { getActiveCategories, type Category } from "@/lib/mock-data";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SiteHeader() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>(() => getActiveCategories());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      return;
    }

    queueMicrotask(() => {
      void (async () => {
        const { data, error } = await supabase
          .from("categories")
          .select("slug,name_en,description,active,show_in_navigation,sort_order")
          .eq("active", true)
          .eq("show_in_navigation", true)
          .eq("level", 1)
          .order("sort_order", { ascending: true });

        if (!active || error || !data?.length) {
          return;
        }

        setCategories(
          data.map((category) => ({
            slug: category.slug,
            name: category.name_en,
            description: category.description ?? "Wholesale category",
            itemCount: 0,
            active: Boolean(category.active),
          })),
        );
      })();
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-orange-100 bg-white shadow-sm">
      <div className="bg-zinc-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 font-bold">
            <Link href="/admin/login" className="hover:underline">Seller Centre</Link>
            <span className="hidden sm:inline">Wholesale Account</span>
          </div>
          <div className="flex items-center gap-4 font-bold">
            <span className="hidden sm:inline">Help</span>
            <span className="hidden sm:inline">Contact</span>
            <a href={messengerUrl} target="_blank" rel="noreferrer" className="hover:underline">Chat on Messenger</a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 py-1 sm:px-6 sm:py-4 lg:px-8">
        <div className="grid gap-2 sm:gap-4 lg:grid-cols-[300px_1fr_auto] lg:items-center">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3">
              <span className="sm:hidden">
                <BrandLogo size="sm" priority />
              </span>
              <span className="hidden sm:inline-flex">
                <BrandLogo size="md" priority />
              </span>
            </Link>
            <div className="flex items-center gap-2 lg:hidden">
              <CartIconLink className="h-9 w-9" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="rounded-sm border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-black text-zinc-700"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-customer-menu"
              >
                Menu
              </button>
            </div>
          </div>

          <div className="lg:min-w-0">
            <ProductSearchForm />
          </div>

          <nav className="hidden flex-wrap items-center gap-3 text-sm font-bold text-zinc-700 lg:flex">
            <Link href="/category/all" className="hidden hover:text-orange-600 lg:inline-flex">Categories</Link>
            <CustomerAuthNav />
            <Link href="/member" className="hidden hover:text-orange-600 sm:inline-flex">Member</Link>
            <Link href="/my-orders" className="hidden hover:text-orange-600 sm:inline-flex">My Orders</Link>
            <CartIconLink className="h-11 w-11" />
            <a href={messengerUrl} target="_blank" rel="noreferrer" className="rounded-sm border border-zinc-200 bg-white px-4 py-3 font-black text-zinc-700 hover:border-orange-200 hover:text-orange-700">
              Messenger
            </a>
          </nav>
        </div>
      </div>

      <nav className="border-t border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-7xl snap-x gap-1 overflow-x-auto px-3 py-1 text-[11px] font-black text-zinc-700 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 sm:px-6 sm:py-2 sm:text-sm lg:px-8 [&::-webkit-scrollbar]:hidden">
          <Link href="/category/all" className={`shrink-0 snap-start rounded-sm px-3 py-1.5 hover:bg-orange-50 hover:text-orange-700 sm:px-4 sm:py-2 ${pathname === "/category/all" ? "bg-[#f65f18] text-white hover:bg-[#f65f18] hover:text-white" : "bg-zinc-100"}`}>All Products</Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className={`shrink-0 snap-start rounded-sm px-3 py-1.5 hover:bg-orange-50 hover:text-orange-700 sm:px-4 sm:py-2 ${pathname === `/category/${category.slug}` ? "bg-[#f65f18] text-white hover:bg-[#f65f18] hover:text-white" : ""}`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div id="mobile-customer-menu" className="border-t border-orange-100 bg-white px-4 py-4 shadow-sm lg:hidden">
          <div className="grid gap-2 text-sm font-black text-zinc-700">
            <div className="rounded-sm bg-zinc-50 px-4 py-3">
              <CustomerAuthNav />
            </div>
            <Link href="/category/all" onClick={() => setMobileMenuOpen(false)} className="rounded-sm bg-zinc-50 px-4 py-3">
              Categories
            </Link>
            <Link href="/my-orders" onClick={() => setMobileMenuOpen(false)} className="rounded-sm bg-zinc-50 px-4 py-3">
              My Orders
            </Link>
            <Link href="/member" onClick={() => setMobileMenuOpen(false)} className="rounded-sm bg-zinc-50 px-4 py-3">
              Member Card
            </Link>
            <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)} className="rounded-sm bg-zinc-950 px-4 py-3 text-white">
              Seller Centre
            </Link>
            <a href={messengerUrl} target="_blank" rel="noreferrer" className="rounded-sm bg-orange-50 px-4 py-3 text-orange-700">
              Chat on Messenger
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
