"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { AdminLanguage } from "@/lib/admin-i18n";

const copy = {
  en: {
    title: "Admin Login",
    subtitle: "Sign in with an approved admin account.",
    email: "Email",
    password: "Password",
    submit: "Login",
    denied: "You do not have admin access.",
    required: "Email and password are required.",
    invalid: "Invalid email or password.",
    config: "Supabase admin auth is not configured.",
    server: "Login failed. Please try again.",
    back: "Back to Store",
  },
  zh: {
    title: "\u540e\u53f0\u767b\u5f55",
    subtitle: "\u8bf7\u4f7f\u7528\u5df2\u6388\u6743\u7684\u7ba1\u7406\u5458\u8d26\u53f7\u767b\u5f55\u3002",
    email: "\u90ae\u7bb1",
    password: "\u5bc6\u7801",
    submit: "\u767b\u5f55",
    denied: "\u4f60\u6ca1\u6709\u540e\u53f0\u8bbf\u95ee\u6743\u9650\u3002",
    required: "\u8bf7\u586b\u5199\u90ae\u7bb1\u548c\u5bc6\u7801\u3002",
    invalid: "\u90ae\u7bb1\u6216\u5bc6\u7801\u4e0d\u6b63\u786e\u3002",
    config: "Supabase \u540e\u53f0\u767b\u5f55\u8fd8\u6ca1\u6709\u914d\u7f6e\u597d\u3002",
    server: "\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002",
    back: "\u8fd4\u56de\u5546\u57ce",
  },
};

const errorKeys = new Set(["denied", "required", "invalid", "config", "server"]);

function AdminLoginFormInner() {
  const searchParams = useSearchParams();
  const denied = Boolean(searchParams.get("denied"));
  const error = searchParams.get("error");
  const [language, setLanguage] = useState<AdminLanguage>("en");
  const [message, setMessage] = useState("");
  const t = copy[language];

  useEffect(() => {
    const stored = window.localStorage.getItem("admin-language");
    const nextLanguage = stored === "zh" ? "zh" : "en";
    const nextError = denied ? "denied" : errorKeys.has(error ?? "") ? error : "";

    queueMicrotask(() => {
      setLanguage(nextLanguage);
      setMessage(nextError ? copy[nextLanguage][nextError as keyof typeof copy.en] : "");
    });
  }, [denied, error]);

  const switchLanguage = (nextLanguage: AdminLanguage) => {
    const nextError = denied ? "denied" : errorKeys.has(error ?? "") ? error : "";

    setLanguage(nextLanguage);
    window.localStorage.setItem("admin-language", nextLanguage);
    setMessage(nextError ? copy[nextLanguage][nextError as keyof typeof copy.en] : "");
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-md">
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

          <button type="submit" className="mt-6 h-11 w-full rounded-md bg-[#f65f18] text-sm font-black text-white">
            {t.submit}
          </button>
        </form>
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
