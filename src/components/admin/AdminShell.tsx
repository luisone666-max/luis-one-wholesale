"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminLanguage, translate, TranslationKey } from "@/lib/admin-i18n";

type AdminRole = "owner" | "admin" | "staff" | "sales" | "cashier" | "warehouse";

type AdminI18nContextValue = {
  language: AdminLanguage;
  setLanguage: (language: AdminLanguage) => void;
  t: (key: TranslationKey) => string;
};

const AdminI18nContext = createContext<AdminI18nContextValue | null>(null);

const navSections: Array<{
  title: { en: string; zh: string };
  items: Array<{ href: string; label: TranslationKey; icon: string; hint: { en: string; zh: string }; roles?: AdminRole[] }>;
}> = [
  {
    title: { en: "Overview", zh: "总览" },
    items: [{ href: "/admin", label: "dashboard", icon: "D", hint: { en: "Daily store summary", zh: "每日店铺概览" }, roles: ["owner", "admin"] }],
  },
  {
    title: { en: "Catalog", zh: "商品" },
    items: [
      { href: "/admin/products", label: "products", icon: "P", hint: { en: "Manage products / price lookup", zh: "管理商品 / 销售查价" }, roles: ["owner", "admin", "warehouse", "sales", "staff"] },
      { href: "/admin/categories", label: "categories", icon: "C", hint: { en: "Category tree", zh: "分类树" }, roles: ["owner", "admin"] },
    ],
  },
  {
    title: { en: "Online Store", zh: "线上订单" },
    items: [
      { href: "/admin/orders", label: "orders", icon: "O", hint: { en: "Website order handling", zh: "网站订单处理" }, roles: ["owner", "admin", "warehouse"] },
      { href: "/admin/customers", label: "customers", icon: "U", hint: { en: "Customer records / member points", zh: "客户资料 / 会员积分" }, roles: ["owner", "admin"] },
      { href: "/admin/payments", label: "payments", icon: "M", hint: { en: "Website manual payments", zh: "线上人工收款" }, roles: ["owner", "admin"] },
    ],
  },
  {
    title: { en: "Offline POS", zh: "线下收银" },
    items: [
      { href: "/admin/sales-desk", label: "salesDesk", icon: "S", hint: { en: "In-store sales slip", zh: "门店销售开单" }, roles: ["owner", "admin", "sales", "staff"] },
      { href: "/admin/cashier", label: "cashierCenter", icon: "C", hint: { en: "Cashier payment confirmation", zh: "收银确认收款" }, roles: ["owner", "admin", "cashier"] },
      { href: "/admin/cash-drawer", label: "cashDrawer", icon: "P", hint: { en: "Daily cash drawer", zh: "每日收银钱箱" }, roles: ["owner", "admin", "cashier"] },
      { href: "/admin/staff", label: "staffAccess", icon: "A", hint: { en: "Staff login and roles", zh: "员工账号与权限" }, roles: ["owner", "admin"] },
    ],
  },
  {
    title: { en: "Business", zh: "经营" },
    items: [
      { href: "/admin/reports", label: "reports", icon: "R", hint: { en: "Reports", zh: "报表" }, roles: ["owner", "admin"] },
      { href: "/admin/owner", label: "ownerCenter", icon: "K", hint: { en: "Owner password gate", zh: "老板中心" }, roles: ["owner", "admin"] },
      { href: "/admin/settings", label: "settings", icon: "S", hint: { en: "Store settings", zh: "店铺设置" }, roles: ["owner", "admin"] },
    ],
  },
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
  const [adminProfile, setAdminProfile] = useState<{ name: string; email: string; role: AdminRole } | null>(null);
  const [language, setLanguageState] = useState<AdminLanguage>("en");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    const stored = window.localStorage.getItem("admin-language");
    const nextLanguage = stored === "en" || stored === "zh" ? stored : "en";
    queueMicrotask(() => setLanguageState(nextLanguage));
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/admin/auth/me")
      .then((response) => response.json())
      .then((result: { ok?: boolean; admin?: { name?: string; email?: string; role?: AdminRole } }) => {
        if (cancelled || !result.ok || !result.admin) {
          return;
        }

        queueMicrotask(() => {
          if (!cancelled) {
            setAdminProfile({
              name: result.admin?.name ?? "Admin",
              email: result.admin?.email ?? "",
              role: result.admin?.role ?? "admin",
            });
          }
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  const role = adminProfile?.role;
  const visibleNavSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || (role ? item.roles.includes(role) : false)),
    }))
    .filter((section) => section.items.length > 0);
  const navItems = visibleNavSections.flatMap((section) => section.items);
  const activeItem = navItems.find((item) => isActive(item.href)) ?? navItems[0] ?? navSections[0].items[0];
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <AdminI18nContext.Provider value={value}>
      <div className="min-h-screen bg-[#f5f5f5] text-zinc-900">
        {mobileMenuOpen ? (
          <button type="button" aria-label="Close menu" onClick={closeMobileMenu} className="fixed inset-0 z-40 bg-zinc-950/35 lg:hidden" />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 border-r border-zinc-200 bg-white shadow-xl transition-all lg:z-30 lg:block lg:shadow-none ${
            mobileMenuOpen ? "block w-72" : "hidden"
          } ${sidebarCollapsed ? "lg:w-20" : "lg:w-72"}`}
        >
          <div className={`flex h-16 items-center gap-3 border-b border-zinc-100 ${sidebarCollapsed ? "justify-center px-3" : "px-5"}`}>
            <span className="grid h-10 w-10 place-items-center rounded-md bg-[#f65f18] text-lg font-black text-white">S</span>
            <div className={sidebarCollapsed ? "hidden" : ""}>
              <p className="text-base font-black text-zinc-950">Seller Center</p>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">WholesaleHub</p>
            </div>
          </div>
          <nav className="h-[calc(100vh-4rem)] space-y-4 overflow-y-auto p-3">
            {visibleNavSections.map((section) => (
              <div key={section.title.en}>
                <p className={`mb-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 ${sidebarCollapsed ? "sr-only" : ""}`}>
                  {language === "zh" ? section.title.zh : section.title.en}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobileMenu}
                        title={value.t(item.label)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                          active ? "bg-orange-50 text-[#f65f18] shadow-sm ring-1 ring-orange-100" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                        } ${sidebarCollapsed ? "justify-center" : ""}`}
                      >
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-xs font-black ${active ? "bg-[#f65f18] text-white" : "bg-zinc-100 text-zinc-500"}`}>
                          {item.icon}
                        </span>
                        <span className={sidebarCollapsed ? "hidden" : "min-w-0"}>
                          <span className="block truncate">{value.t(item.label)}</span>
                          <span className="block truncate text-[11px] font-bold text-zinc-400">{language === "zh" ? item.hint.zh : item.hint.en}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className={`min-w-0 transition-all ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"}`}>
          <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
            <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setMobileMenuOpen(true)} className="grid h-10 w-10 place-items-center rounded-md border border-zinc-200 bg-white text-lg font-black text-zinc-700 lg:hidden">
                  =
                </button>
                <button type="button" onClick={() => setSidebarCollapsed((current) => !current)} className="hidden h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm font-black text-zinc-700 lg:block">
                  {sidebarCollapsed ? (language === "zh" ? "展开" : "Open") : language === "zh" ? "折叠" : "Fold"}
                </button>
                <div>
                  <p className="text-xs font-bold text-zinc-500">WholesaleHub</p>
                  <p className="text-lg font-black text-zinc-950">{value.t(activeItem.label)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-600">{value.t("notifications")}</div>
                <div className="flex rounded-md border border-orange-200 bg-orange-50 p-1">
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`rounded px-3 py-1.5 text-sm font-black ${language === "en" ? "bg-[#f65f18] text-white" : "text-orange-700"}`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("zh")}
                    className={`rounded px-3 py-1.5 text-sm font-black ${language === "zh" ? "bg-[#f65f18] text-white" : "text-orange-700"}`}
                  >
                    中文
                  </button>
                </div>
                <div className="hidden rounded-md bg-zinc-950 px-4 py-2 text-sm font-black text-white xl:block">
                  <span>{adminProfile?.name ?? value.t("adminName")}</span>
                  {adminProfile?.email ? <span className="ml-2 text-xs font-bold text-zinc-300">{adminProfile.email}</span> : null}
                </div>
                <button type="button" onClick={logout} className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700">
                  {value.t("logout")}
                </button>
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto border-t border-zinc-100 px-4 py-2 lg:hidden">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${isActive(item.href) ? "bg-[#f65f18] text-white" : "bg-zinc-100 text-zinc-700"}`}>
                  {value.t(item.label)}
                </Link>
              ))}
            </nav>
          </header>
          <main className="min-w-0 overflow-x-auto px-4 py-6 pb-28 lg:px-8">{children}</main>
        </div>
      </div>
    </AdminI18nContext.Provider>
  );
}
