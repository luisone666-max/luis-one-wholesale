"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AdminLanguage, translate, TranslationKey } from "@/lib/admin-i18n";

type AdminI18nContextValue = {
  language: AdminLanguage;
  setLanguage: (language: AdminLanguage) => void;
  t: (key: TranslationKey) => string;
};

const AdminI18nContext = createContext<AdminI18nContextValue | null>(null);

const navItems: Array<{ href: string; label: TranslationKey }> = [
  { href: "/admin", label: "dashboard" },
  { href: "/admin/products", label: "products" },
  { href: "/admin/categories", label: "categories" },
  { href: "/admin/orders", label: "orders" },
  { href: "/admin/customers", label: "customers" },
  { href: "/admin/wholesale-prices", label: "wholesalePrices" },
  { href: "/admin/payments", label: "payments" },
  { href: "/admin/reports", label: "reports" },
  { href: "/admin/settings", label: "settings" },
];

export function useAdminI18n() {
  const value = useContext(AdminI18nContext);

  if (!value) {
    throw new Error("useAdminI18n must be used inside AdminShell");
  }

  return value;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [language, setLanguageState] = useState<AdminLanguage>(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    const stored = window.localStorage.getItem("admin-language");
    return stored === "en" || stored === "zh" ? stored : "en";
  });

  const setLanguage = useCallback((nextLanguage: AdminLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem("admin-language", nextLanguage);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) => translate(language, key),
    }),
    [language, setLanguage],
  );

  return (
    <AdminI18nContext.Provider value={value}>
      <div className="min-h-screen bg-[#f5f5f5] text-zinc-900">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200 bg-white lg:block">
          <div className="flex h-16 items-center gap-3 border-b border-zinc-100 px-5">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-[#f65f18] text-lg font-black text-white">S</span>
            <div>
              <p className="text-base font-black text-zinc-950">Seller Center</p>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">WholesaleHub</p>
            </div>
          </div>
          <nav className="space-y-1 p-3">
            {navItems.map((item) => {
              const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-md px-4 py-3 text-sm font-bold transition ${
                    active ? "bg-orange-50 text-[#f65f18]" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                  }`}
                >
                  <span>{value.t(item.label)}</span>
                  {active ? <span className="h-2 w-2 rounded-full bg-[#f65f18]" /> : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
            <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <div className="flex items-center gap-3 lg:hidden">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-[#f65f18] text-base font-black text-white">S</span>
                <p className="font-black text-zinc-950">Seller Center</p>
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-bold text-zinc-500">WholesaleHub</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-700">
                  {value.t("notifications")}
                </div>
                <div className="flex rounded-md border border-orange-200 bg-orange-50 p-1">
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`rounded px-3 py-1.5 text-sm font-black ${
                      language === "en" ? "bg-[#f65f18] text-white" : "text-orange-700"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("zh")}
                    className={`rounded px-3 py-1.5 text-sm font-black ${
                      language === "zh" ? "bg-[#f65f18] text-white" : "text-orange-700"
                    }`}
                  >
                    中文
                  </button>
                </div>
                <div className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-black text-white">{value.t("adminName")}</div>
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto border-t border-zinc-100 px-4 py-2 lg:hidden">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="shrink-0 rounded-full bg-zinc-100 px-3 py-2 text-xs font-bold">
                  {value.t(item.label)}
                </Link>
              ))}
            </nav>
          </header>
          <main className="px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </AdminI18nContext.Provider>
  );
}
