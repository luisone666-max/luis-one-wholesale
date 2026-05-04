"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import type { AdminLanguage } from "@/lib/admin-i18n";

const copy = {
  en: {
    title: "Admin Login",
    subtitle: "Sign in with an approved admin account.",
    email: "Email",
    password: "Password",
    submit: "Login",
    loading: "Checking access...",
    success: "Login successful. Opening admin dashboard...",
    openDashboard: "Open Admin Dashboard",
    networkError: "Login request failed. Please check your connection and try again.",
    denied: "You do not have admin access.",
    required: "Email and password are required.",
    back: "Back to Store",
  },
  zh: {
    title: "\u540e\u53f0\u767b\u5f55",
    subtitle: "\u8bf7\u4f7f\u7528\u5df2\u6388\u6743\u7684\u7ba1\u7406\u5458\u8d26\u53f7\u767b\u5f55\u3002",
    email: "\u90ae\u7bb1",
    password: "\u5bc6\u7801",
    submit: "\u767b\u5f55",
    loading: "\u6b63\u5728\u68c0\u67e5\u6743\u9650...",
    success: "\u767b\u5f55\u6210\u529f\uff0c\u6b63\u5728\u6253\u5f00\u540e\u53f0...",
    openDashboard: "\u6253\u5f00\u540e\u53f0",
    networkError: "\u767b\u5f55\u8bf7\u6c42\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u540e\u91cd\u8bd5\u3002",
    denied: "\u4f60\u6ca1\u6709\u540e\u53f0\u8bbf\u95ee\u6743\u9650\u3002",
    required: "\u8bf7\u586b\u5199\u90ae\u7bb1\u548c\u5bc6\u7801\u3002",
    back: "\u8fd4\u56de\u5546\u57ce",
  },
};

function AdminLoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const denied = Boolean(searchParams.get("denied"));
  const [language, setLanguage] = useState<AdminLanguage>("en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loginSucceeded, setLoginSucceeded] = useState(false);
  const [busy, setBusy] = useState(false);
  const t = copy[language];

  useEffect(() => {
    const stored = window.localStorage.getItem("admin-language");
    const nextLanguage = stored === "zh" ? "zh" : "en";

    queueMicrotask(() => {
      setLanguage(nextLanguage);
      setMessage(denied ? copy[nextLanguage].denied : "");
    });
  }, [denied]);

  const switchLanguage = (nextLanguage: AdminLanguage) => {
    setLanguage(nextLanguage);
    window.localStorage.setItem("admin-language", nextLanguage);
    setMessage(denied ? copy[nextLanguage].denied : "");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setMessage(t.required);
      return;
    }

    setBusy(true);
    setMessage(t.loading);
    setLoginSucceeded(false);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json().catch(() => ({ ok: false, message: "Login failed." }))) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "Login failed.");
        return;
      }

      setMessage(t.success);
      setLoginSucceeded(true);
      router.push("/admin");
      router.refresh();

      window.setTimeout(() => {
        window.location.href = "/admin";
      }, 300);
    } catch {
      setMessage(t.networkError);
    } finally {
      setBusy(false);
    }
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

        <form onSubmit={submit} className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
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
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-orange-500"
            />
          </label>

          <label className="mt-4 block text-sm font-bold text-zinc-700">
            {t.password}
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-orange-500"
            />
          </label>

          <button type="submit" disabled={busy} className="mt-6 h-11 w-full rounded-md bg-[#f65f18] text-sm font-black text-white disabled:cursor-wait disabled:opacity-50">
            {busy ? t.loading : t.submit}
          </button>
          {loginSucceeded ? (
            <Link href="/admin" className="mt-3 flex h-11 w-full items-center justify-center rounded-md border border-orange-200 bg-orange-50 text-sm font-black text-orange-700">
              {t.openDashboard}
            </Link>
          ) : null}
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
