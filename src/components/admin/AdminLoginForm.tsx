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
    denied: "You do not have admin access.",
    required: "Email and password are required.",
    back: "Back to Store",
  },
  zh: {
    title: "后台登录",
    subtitle: "请使用已授权的管理员账号登录。",
    email: "邮箱",
    password: "密码",
    submit: "登录",
    loading: "正在检查权限...",
    denied: "你没有后台访问权限。",
    required: "请输入邮箱和密码。",
    back: "返回前台",
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
    setMessage("");

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

      router.replace("/admin");
      router.refresh();
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
              中文
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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-orange-500"
            />
          </label>

          <label className="mt-4 block text-sm font-bold text-zinc-700">
            {t.password}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-orange-500"
            />
          </label>

          <button type="submit" disabled={busy} className="mt-6 h-11 w-full rounded-md bg-[#f65f18] text-sm font-black text-white disabled:opacity-50">
            {busy ? t.loading : t.submit}
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
