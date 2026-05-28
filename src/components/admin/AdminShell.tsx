"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ActiveAdminUser } from "@/lib/admin-auth";
import { translate, type AdminLanguage, type TranslationKey } from "@/lib/admin-i18n";

type AdminRole = "owner" | "admin" | "staff" | "sales" | "cashier" | "warehouse";

type AdminI18nContextValue = {
  language: AdminLanguage;
  setLanguage: (language: AdminLanguage) => void;
  t: (key: TranslationKey) => string;
};

type NavItem = {
  href: string;
  label: TranslationKey | { en: string; zh: string };
  icon: string;
  hint: { en: string; zh: string };
  roles?: AdminRole[];
};

type RoleQuickAction = {
  href: string;
  label: { en: string; zh: string };
  description: { en: string; zh: string };
  roles: AdminRole[];
};

const AdminI18nContext = createContext<AdminI18nContextValue | null>(null);

const navSections: Array<{
  title: { en: string; zh: string };
  items: NavItem[];
}> = [
  {
    title: { en: "Overview", zh: "\u603b\u89c8" },
    items: [
      {
        href: "/admin",
        label: "dashboard",
        icon: "D",
        hint: { en: "Daily store summary", zh: "\u6bcf\u65e5\u5e97\u94fa\u6982\u89c8" },
        roles: ["owner", "admin"],
      },
    ],
  },
  {
    title: { en: "Catalog", zh: "\u5546\u54c1" },
    items: [
      {
        href: "/admin/products",
        label: "products",
        icon: "P",
        hint: { en: "Manage products / price lookup", zh: "\u7ba1\u7406\u5546\u54c1 / \u9500\u552e\u67e5\u4ef7" },
        roles: ["owner", "admin", "warehouse", "sales", "staff"],
      },
      {
        href: "/admin/categories",
        label: "categories",
        icon: "C",
        hint: { en: "Category tree", zh: "\u5206\u7c7b\u6811" },
        roles: ["owner", "admin"],
      },
    ],
  },
  {
    title: { en: "Online Store", zh: "\u7ebf\u4e0a\u8ba2\u5355" },
    items: [
      {
        href: "/admin/orders",
        label: "orders",
        icon: "O",
        hint: { en: "Website order handling", zh: "\u7f51\u7ad9\u8ba2\u5355\u5904\u7406" },
        roles: ["owner", "admin", "warehouse"],
      },
      {
        href: "/admin/logistics",
        label: { en: "Logistics", zh: "\u7269\u6d41" },
        icon: "L",
        hint: { en: "COD, waybills, J&T readiness", zh: "COD\u3001\u9762\u5355\u3001J&T \u51c6\u5907\u5ea6" },
        roles: ["owner", "admin", "warehouse"],
      },
      {
        href: "/admin/customers",
        label: "customers",
        icon: "U",
        hint: { en: "Customer records / member points", zh: "\u5ba2\u6237\u8d44\u6599 / \u4f1a\u5458\u79ef\u5206" },
        roles: ["owner", "admin"],
      },
      {
        href: "/admin/payments",
        label: "payments",
        icon: "M",
        hint: { en: "Website manual payments", zh: "\u7ebf\u4e0a\u4eba\u5de5\u6536\u6b3e" },
        roles: ["owner", "admin"],
      },
    ],
  },
  {
    title: { en: "Offline POS", zh: "\u7ebf\u4e0b\u6536\u94f6" },
    items: [
      {
        href: "/admin/sales-desk",
        label: "salesDesk",
        icon: "S",
        hint: { en: "In-store sales slip", zh: "\u95e8\u5e97\u9500\u552e\u5f00\u5355" },
        roles: ["owner", "admin", "sales", "staff"],
      },
      {
        href: "/admin/cashier",
        label: "cashierCenter",
        icon: "C",
        hint: { en: "Cashier payment confirmation", zh: "\u6536\u94f6\u786e\u8ba4\u6536\u6b3e" },
        roles: ["owner", "admin", "cashier"],
      },
      {
        href: "/admin/cash-drawer",
        label: "cashDrawer",
        icon: "P",
        hint: { en: "Daily cash drawer", zh: "\u6bcf\u65e5\u6536\u94f6\u94b1\u7bb1" },
        roles: ["owner", "admin", "cashier"],
      },
      {
        href: "/admin/staff",
        label: "staffAccess",
        icon: "A",
        hint: { en: "Staff login and roles", zh: "\u5458\u5de5\u8d26\u53f7\u4e0e\u6743\u9650" },
        roles: ["owner", "admin"],
      },
    ],
  },
  {
    title: { en: "Business", zh: "\u7ecf\u8425" },
    items: [
      {
        href: "/admin/reports",
        label: "reports",
        icon: "R",
        hint: { en: "Reports", zh: "\u62a5\u8868" },
        roles: ["owner", "admin"],
      },
      {
        href: "/admin/owner",
        label: "ownerCenter",
        icon: "K",
        hint: { en: "Owner password gate", zh: "\u8001\u677f\u4e2d\u5fc3" },
        roles: ["owner", "admin"],
      },
      {
        href: "/admin/settings",
        label: "settings",
        icon: "S",
        hint: { en: "Store settings", zh: "\u5e97\u94fa\u8bbe\u7f6e" },
        roles: ["owner", "admin"],
      },
    ],
  },
  {
    title: { en: "Guide", zh: "\u6307\u5357" },
    items: [
      {
        href: "/admin/help",
        label: { en: "Operations Guide", zh: "\u64cd\u4f5c\u6307\u5357" },
        icon: "?",
        hint: { en: "Role-based daily workflow", zh: "\u6309\u89d2\u8272\u770b\u6bcf\u65e5\u6d41\u7a0b" },
        roles: ["owner", "admin", "staff", "sales", "cashier", "warehouse"],
      },
    ],
  },
];

const roleQuickActions: RoleQuickAction[] = [
  {
    href: "/admin/sales-desk",
    label: { en: "Create Sales Slip", zh: "\u9500\u552e\u5f00\u5355" },
    description: { en: "For in-store sales and member points", zh: "\u7ebf\u4e0b\u9500\u552e\u4e0e\u4f1a\u5458\u79ef\u5206" },
    roles: ["owner", "admin", "sales", "staff"],
  },
  {
    href: "/admin/products",
    label: { en: "Product / Price Lookup", zh: "\u5546\u54c1\u67e5\u4ef7" },
    description: { en: "Check SKU, price, MOQ, and stock", zh: "\u67e5 SKU\u3001\u4ef7\u683c\u3001MOQ\u548c\u5e93\u5b58" },
    roles: ["owner", "admin", "warehouse", "sales", "staff"],
  },
  {
    href: "/admin/cashier",
    label: { en: "Confirm Payment", zh: "\u786e\u8ba4\u6536\u6b3e" },
    description: { en: "Cash, GCash, bank transfer", zh: "\u73b0\u91d1\u3001GCash\u3001\u94f6\u884c\u8f6c\u8d26" },
    roles: ["owner", "admin", "cashier"],
  },
  {
    href: "/admin/cash-drawer",
    label: { en: "Cash Drawer", zh: "\u94b1\u7bb1\u65e5\u7ed3" },
    description: { en: "Opening cash, cash out, closing", zh: "\u5f00\u7bb1\u3001\u652f\u51fa\u3001\u5173\u8d26" },
    roles: ["owner", "admin", "cashier"],
  },
  {
    href: "/admin/orders",
    label: { en: "Online Orders", zh: "\u7ebf\u4e0a\u8ba2\u5355" },
    description: { en: "Website orders and manual follow-up", zh: "\u7f51\u7ad9\u8ba2\u5355\u4e0e\u4eba\u5de5\u8ddf\u8fdb" },
    roles: ["owner", "admin", "warehouse"],
  },
  {
    href: "/admin/logistics",
    label: { en: "Logistics Readiness", zh: "\u7269\u6d41\u51c6\u5907\u5ea6" },
    description: { en: "COD, waybills, and J&T checklist", zh: "COD\u3001\u9762\u5355\u4e0e J&T \u6e05\u5355" },
    roles: ["owner", "admin", "warehouse"],
  },
  {
    href: "/admin/reports",
    label: { en: "Reports", zh: "\u7ecf\u8425\u62a5\u8868" },
    description: { en: "Monthly employee and store totals", zh: "\u5458\u5de5\u4e0e\u95e8\u5e97\u6708\u5ea6\u6570\u636e" },
    roles: ["owner", "admin"],
  },
  {
    href: "/admin/staff",
    label: { en: "Staff Access", zh: "\u5458\u5de5\u6743\u9650" },
    description: { en: "Create staff and assign roles", zh: "\u521b\u5efa\u5458\u5de5\u5e76\u5206\u914d\u6743\u9650" },
    roles: ["owner", "admin"],
  },
  {
    href: "/admin/help",
    label: { en: "Daily Workflow Guide", zh: "\u6bcf\u65e5\u6d41\u7a0b\u6307\u5357" },
    description: { en: "What each role should do", zh: "\u6bcf\u4e2a\u89d2\u8272\u8be5\u505a\u4ec0\u4e48" },
    roles: ["owner", "admin", "staff", "sales", "cashier", "warehouse"],
  },
];

function adminSectionTitle(section: (typeof navSections)[number], language: AdminLanguage) {
  return language === "zh" ? section.title.zh : section.title.en;
}

function adminNavHint(item: NavItem, language: AdminLanguage) {
  return language === "zh" ? item.hint.zh : item.hint.en;
}

function adminNavLabel(item: NavItem, language: AdminLanguage, t: (key: TranslationKey) => string) {
  return typeof item.label === "string" ? t(item.label) : language === "zh" ? item.label.zh : item.label.en;
}

function quickActionLabel(item: RoleQuickAction, language: AdminLanguage) {
  return language === "zh" ? item.label.zh : item.label.en;
}

function quickActionDescription(item: RoleQuickAction, language: AdminLanguage) {
  return language === "zh" ? item.description.zh : item.description.en;
}

export function useAdminI18n() {
  const value = useContext(AdminI18nContext);

  if (!value) {
    throw new Error("useAdminI18n must be used inside AdminShell");
  }

  return value;
}

function toAdminProfile(admin: ActiveAdminUser | null | undefined) {
  if (!admin) {
    return null;
  }

  return {
    name: admin.name || admin.email || "Admin",
    email: admin.email,
    role: admin.role,
  };
}

export function AdminShell({ children, initialAdmin = null }: { children: ReactNode; initialAdmin?: ActiveAdminUser | null }) {
  const pathname = usePathname();
  const [adminProfile, setAdminProfile] = useState<{ name: string; email: string; role: AdminRole } | null>(() => toAdminProfile(initialAdmin));
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
  const visibleQuickActions = roleQuickActions.filter((item) => role && item.roles.includes(role)).slice(0, role === "owner" || role === "admin" ? 6 : 4);
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
            <span className="grid h-10 w-10 place-items-center rounded-md bg-[#f65f18] text-lg font-black text-white">L</span>
            <div className={sidebarCollapsed ? "hidden" : ""}>
              <p className="text-base font-black text-zinc-950">Seller Centre</p>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Luis One</p>
            </div>
          </div>
          <nav className="h-[calc(100vh-4rem)] space-y-4 overflow-y-auto p-3">
            {visibleNavSections.map((section) => (
              <div key={section.title.en}>
                <p className={`mb-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 ${sidebarCollapsed ? "sr-only" : ""}`}>
                  {adminSectionTitle(section, language)}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobileMenu}
                        title={adminNavLabel(item, language, value.t)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                          active ? "bg-orange-50 text-[#f65f18] shadow-sm ring-1 ring-orange-100" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                        } ${sidebarCollapsed ? "justify-center" : ""}`}
                      >
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-xs font-black ${active ? "bg-[#f65f18] text-white" : "bg-zinc-100 text-zinc-500"}`}>
                          {item.icon}
                        </span>
                        <span className={sidebarCollapsed ? "hidden" : "min-w-0"}>
                          <span className="block truncate">{adminNavLabel(item, language, value.t)}</span>
                          <span className="block truncate text-[11px] font-bold text-zinc-400">{adminNavHint(item, language)}</span>
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
                  {sidebarCollapsed ? (language === "zh" ? "\u5c55\u5f00" : "Open") : language === "zh" ? "\u6298\u53e0" : "Fold"}
                </button>
                <div>
                  <p className="text-xs font-bold text-zinc-500">Luis One Supply Hub</p>
                  <p className="text-lg font-black text-zinc-950">{adminNavLabel(activeItem, language, value.t)}</p>
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
                  {adminProfile?.role ? (
                    <span className="mr-2 rounded bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-orange-200">
                      {adminProfile.role}
                    </span>
                  ) : null}
                  <span>{adminProfile?.name ?? value.t("adminName")}</span>
                  {adminProfile?.email ? <span className="ml-2 text-xs font-bold text-zinc-300">{adminProfile.email}</span> : null}
                </div>
                <button type="button" onClick={logout} className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700">
                  {value.t("logout")}
                </button>
              </div>
            </div>
            {visibleQuickActions.length ? (
              <div className="border-t border-zinc-100 bg-zinc-50/70 px-4 py-3 lg:px-8">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">
                    {language === "zh" ? "\u4f60\u7684\u5de5\u4f5c\u5165\u53e3" : "Your Workspace"}
                  </p>
                  {adminProfile?.role ? (
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-orange-700 ring-1 ring-orange-100">
                      {adminProfile.role}
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {visibleQuickActions.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`min-w-[172px] shrink-0 rounded-md border px-3 py-2 text-left transition ${
                        isActive(item.href)
                          ? "border-orange-200 bg-orange-50 text-orange-800"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-200 hover:text-orange-700"
                      }`}
                    >
                      <span className="block text-sm font-black">{quickActionLabel(item, language)}</span>
                      <span className="mt-1 block text-[11px] font-bold leading-4 text-zinc-500">{quickActionDescription(item, language)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            <nav className="flex gap-2 overflow-x-auto border-t border-zinc-100 px-4 py-2 lg:hidden">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${isActive(item.href) ? "bg-[#f65f18] text-white" : "bg-zinc-100 text-zinc-700"}`}>
                  {adminNavLabel(item, language, value.t)}
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
