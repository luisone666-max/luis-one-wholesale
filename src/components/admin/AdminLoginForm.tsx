"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { AdminLanguage } from "@/lib/admin-i18n";

const copy = {
  en: {
    title: "Seller Centre Login",
    subtitle: "One secure login for owner, sales, cashier, warehouse, and staff accounts.",
    email: "Email",
    password: "Password",
    submit: "Login and Open My Centre",
    denied: "You do not have admin access.",
    required: "Email and password are required.",
    invalid: "Invalid email or password.",
    config: "Supabase admin auth is not configured.",
    server: "Login failed. Please try again.",
    back: "Back to Store",
    centerTitle: "Choose your work centre",
    centerHint: "This is only a guide. After login, the system opens the correct centre based on your account role.",
    accessRule: "Owner and admin can manage everything. Sales, cashier, warehouse, and staff accounts only see their own work tools.",
    selected: "Selected",
    centres: {
      owner: {
        title: "Owner / Admin",
        description: "Full management, reports, staff access, products, orders, and store settings.",
      },
      sales: {
        title: "Sales Desk",
        description: "Create offline sales slips, check product prices, and review personal sales records.",
      },
      cashier: {
        title: "Cashier Centre",
        description: "Confirm payment, separate cash / GCash / bank transfer, and manage the daily cash drawer.",
      },
      warehouse: {
        title: "Warehouse",
        description: "Handle online orders, check products, and support packing or pickup preparation.",
      },
      staff: {
        title: "Staff",
        description: "Limited tools for price lookup and daily in-store selling tasks.",
      },
    },
  },
  zh: {
    title: "Seller Centre \u7edf\u4e00\u767b\u5f55",
    subtitle: "\u8001\u677f\u3001\u9500\u552e\u3001\u6536\u94f6\u3001\u4ed3\u5e93\u3001\u5458\u5de5\u90fd\u4ece\u8fd9\u91cc\u767b\u5f55\u3002",
    email: "\u90ae\u7bb1",
    password: "\u5bc6\u7801",
    submit: "\u767b\u5f55\u5e76\u6253\u5f00\u6211\u7684\u540e\u53f0",
    denied: "\u4f60\u6ca1\u6709\u540e\u53f0\u8bbf\u95ee\u6743\u9650\u3002",
    required: "\u8bf7\u586b\u5199\u90ae\u7bb1\u548c\u5bc6\u7801\u3002",
    invalid: "\u90ae\u7bb1\u6216\u5bc6\u7801\u4e0d\u6b63\u786e\u3002",
    config: "Supabase \u540e\u53f0\u767b\u5f55\u8fd8\u6ca1\u6709\u914d\u7f6e\u597d\u3002",
    server: "\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002",
    back: "\u8fd4\u56de\u5546\u57ce",
    centerTitle: "\u9009\u62e9\u4f60\u8981\u8fdb\u7684\u5de5\u4f5c\u4e2d\u5fc3",
    centerHint: "\u8fd9\u91cc\u53ea\u662f\u5e2e\u4f60\u770b\u6e05\u6d41\u7a0b\u3002\u767b\u5f55\u540e\uff0c\u7cfb\u7edf\u4f1a\u6309\u8d26\u53f7\u6743\u9650\u81ea\u52a8\u8fdb\u5165\u5bf9\u5e94\u540e\u53f0\u3002",
    accessRule: "\u8001\u677f\u548c\u7ba1\u7406\u5458\u770b\u5168\u90e8\uff1b\u9500\u552e\u3001\u6536\u94f6\u3001\u4ed3\u5e93\u3001\u5458\u5de5\u53ea\u770b\u81ea\u5df1\u7684\u5de5\u4f5c\u5de5\u5177\u3002",
    selected: "\u5df2\u9009",
    centres: {
      owner: {
        title: "\u8001\u677f / \u7ba1\u7406\u5458",
        description: "\u7ba1\u5168\u90e8\u6570\u636e\u3001\u62a5\u8868\u3001\u5458\u5de5\u6743\u9650\u3001\u5546\u54c1\u3001\u8ba2\u5355\u548c\u5e97\u94fa\u8bbe\u7f6e\u3002",
      },
      sales: {
        title: "\u9500\u552e\u5f00\u5355",
        description: "\u7ebf\u4e0b\u5f00\u9500\u552e\u5355\u3001\u67e5\u5546\u54c1\u4ef7\u683c\u3001\u770b\u81ea\u5df1\u7684\u9500\u552e\u8bb0\u5f55\u3002",
      },
      cashier: {
        title: "\u6536\u94f6\u4e2d\u5fc3",
        description: "\u786e\u8ba4\u6536\u6b3e\uff0c\u533a\u5206\u73b0\u91d1 / GCash / \u94f6\u884c\u8f6c\u8d26\uff0c\u7ba1\u7406\u6bcf\u65e5\u94b1\u7bb1\u3002",
      },
      warehouse: {
        title: "\u4ed3\u5e93",
        description: "\u5904\u7406\u7f51\u7ad9\u8ba2\u5355\u3001\u67e5\u770b\u5546\u54c1\uff0c\u914d\u5408\u5907\u8d27\u3001\u6253\u5305\u3001\u81ea\u63d0\u3002",
      },
      staff: {
        title: "\u5458\u5de5",
        description: "\u53ea\u4fdd\u7559\u67e5\u4ef7\u548c\u95e8\u5e97\u65e5\u5e38\u9500\u552e\u9700\u8981\u7684\u5de5\u5177\u3002",
      },
    },
  },
};

const errorKeys = new Set(["denied", "required", "invalid", "config", "server"]);
type LoginErrorKey = "denied" | "required" | "invalid" | "config" | "server";
type CentreKey = "owner" | "sales" | "cashier" | "warehouse" | "staff";
const centreKeys: CentreKey[] = ["owner", "sales", "cashier", "warehouse", "staff"];

function loginErrorMessage(language: AdminLanguage, error: string | null | undefined, denied: boolean) {
  const key = denied ? "denied" : errorKeys.has(error ?? "") ? (error as LoginErrorKey) : null;
  return key ? copy[language][key] : "";
}

function AdminLoginFormInner() {
  const searchParams = useSearchParams();
  const denied = Boolean(searchParams.get("denied"));
  const error = searchParams.get("error");
  const [language, setLanguage] = useState<AdminLanguage>("en");
  const [message, setMessage] = useState("");
  const [selectedCentre, setSelectedCentre] = useState<CentreKey>("sales");
  const t = copy[language];

  useEffect(() => {
    const stored = window.localStorage.getItem("admin-language");
    const nextLanguage = stored === "zh" ? "zh" : "en";

    queueMicrotask(() => {
      setLanguage(nextLanguage);
      setMessage(loginErrorMessage(nextLanguage, error, denied));
    });
  }, [denied, error]);

  const switchLanguage = (nextLanguage: AdminLanguage) => {
    setLanguage(nextLanguage);
    window.localStorage.setItem("admin-language", nextLanguage);
    setMessage(loginErrorMessage(nextLanguage, error, denied));
  };
  const centre = t.centres[selectedCentre];

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-sm font-black text-orange-700">{t.back}</Link>
          <div className="flex rounded-md border border-orange-200 bg-orange-50 p-1">
            <button
              type="button"
              onClick={() => switchLanguage("en")}
              className={`rounded px-3 py-1.5 text-sm font-black ${language === "en" ? "bg-[#f65f18] text-white" : "text-orange-700"}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => switchLanguage("zh")}
              className={`rounded px-3 py-1.5 text-sm font-black ${language === "zh" ? "bg-[#f65f18] text-white" : "text-orange-700"}`}
            >
              {"\u4e2d\u6587"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <form action="/api/admin/auth/login" method="post" className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-[#f65f18] text-lg font-black text-white">S</span>
              <div>
                <p className="text-xl font-black text-zinc-950">{t.title}</p>
                <p className="text-sm font-bold text-zinc-500">{t.subtitle}</p>
              </div>
            </div>

            {message ? <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-700">{message}</div> : null}

            <label className="block text-sm font-bold text-zinc-700">
              {t.email}
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="mt-2 h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-orange-500"
              />
            </label>

            <label className="mt-4 block text-sm font-bold text-zinc-700">
              {t.password}
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="mt-2 h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-orange-500"
              />
            </label>

            <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-black text-zinc-950">{centre.title}</p>
              <p className="mt-1 text-xs font-bold leading-relaxed text-zinc-500">{centre.description}</p>
            </div>

            <button type="submit" className="mt-6 h-11 w-full rounded-md bg-[#f65f18] text-sm font-black text-white">
              {t.submit}
            </button>
          </form>

          <section className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Luis One Supply Hub</p>
              <h1 className="mt-2 text-2xl font-black text-zinc-950">{t.centerTitle}</h1>
              <p className="mt-2 text-sm font-bold leading-relaxed text-zinc-500">{t.centerHint}</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {centreKeys.map((key) => {
                const item = t.centres[key];
                const active = selectedCentre === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCentre(key)}
                    className={`rounded-md border p-4 text-left transition ${
                      active ? "border-orange-300 bg-orange-50 shadow-sm" : "border-zinc-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black text-zinc-950">{item.title}</p>
                      {active ? <span className="shrink-0 rounded bg-[#f65f18] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">{t.selected}</span> : null}
                    </div>
                    <p className="mt-2 text-xs font-bold leading-relaxed text-zinc-500">{item.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm font-bold leading-relaxed text-zinc-600">
              {t.accessRule}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export function AdminLoginForm() {
  return (
    <Suspense>
      <AdminLoginFormInner />
    </Suspense>
  );
}
