"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { GoogleQuickSignInButton } from "@/components/auth/GoogleQuickSignInButton";
import { getCurrentCustomerSession, getFriendlyAuthError, normalizeCustomerRedirect } from "@/lib/customer-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm({ registered = false }: { registered?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      void (async () => {
        const supabase = createBrowserSupabaseClient();

        if (!supabase) {
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active || !user) {
          return;
        }

        const session = await getCurrentCustomerSession({ ensureProfile: true });

        if (!active) {
          return;
        }

        if (!session.customer) {
          setMessage("Login succeeded, but customer profile could not be created. Please contact us on Messenger.");
          setSuccessMessage(false);
          return;
        }

        const redirectTo = normalizeCustomerRedirect(new URLSearchParams(window.location.search).get("redirect"));
        router.replace(redirectTo);
        router.refresh();
      })();
    });

    return () => {
      active = false;
    };
  }, [router]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccessMessage(false);

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setMessage("Supabase Auth is not configured yet. Please check environment variables.");
      setSuccessMessage(false);
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(getFriendlyAuthError(error.message));
      setSuccessMessage(false);
      return;
    }

    const session = await getCurrentCustomerSession({ ensureProfile: true });

    if (!session.customer) {
      setMessage("Login succeeded, but customer profile could not be loaded. Please contact us on Messenger.");
      setSuccessMessage(false);
      return;
    }

    const redirectTo = normalizeCustomerRedirect(new URLSearchParams(window.location.search).get("redirect"));
    router.push(redirectTo);
    router.refresh();
  };

  const sendPasswordReset = async () => {
    const supabase = createBrowserSupabaseClient();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setMessage("Please enter your email address first, then click Forgot Password.");
      setSuccessMessage(false);
      return;
    }

    if (!supabase) {
      setMessage("Supabase Auth is not configured yet. Please check environment variables.");
      setSuccessMessage(false);
      return;
    }

    setResetLoading(true);
    setMessage("");
    setSuccessMessage(false);

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setResetLoading(false);

    if (error) {
      setMessage(getFriendlyAuthError(error.message));
      setSuccessMessage(false);
      return;
    }

    setSuccessMessage(true);
    setMessage("Password reset email sent. Please check your inbox.");
  };

  return (
    <div className="rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-zinc-950">Login to Your Wholesale Account</h2>
      <p className="mt-2 text-sm text-zinc-600">Access your Luis One Supply Hub order list and wholesale orders.</p>
      {registered ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          Account created. Please login to continue.
        </p>
      ) : null}
      <div className="mt-5 rounded-sm border border-orange-100 bg-orange-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-zinc-950">Quick sign in</p>
            <p className="mt-1 text-xs font-bold text-zinc-500">No password needed when you use Google.</p>
          </div>
        </div>
        <GoogleQuickSignInButton className="mt-3" />
      </div>
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">or email login</span>
        <span className="h-px flex-1 bg-zinc-200" />
      </div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-bold text-zinc-800">
          Email
          <input
            type="email"
            value={email}
            required
            placeholder="Email address"
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 h-12 w-full rounded-sm border border-zinc-200 px-4 outline-none focus:border-orange-500"
          />
        </label>
        <label className="block text-sm font-bold text-zinc-800">
          Password
          <input
            type="password"
            value={password}
            required
            placeholder="Enter password"
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 h-12 w-full rounded-sm border border-zinc-200 px-4 outline-none focus:border-orange-500"
          />
        </label>
        {message ? (
          <p className={`rounded-md border px-4 py-3 text-sm font-bold ${successMessage ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-sm bg-[#f65f18] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-orange-300"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/register" className="font-black text-orange-700">
          Create Account
        </Link>
        <Link href="/category/all" className="font-black text-zinc-600">
          Continue Shopping
        </Link>
        <button type="button" onClick={sendPasswordReset} disabled={resetLoading} className="font-bold text-zinc-500 hover:text-orange-700 disabled:opacity-60">
          {resetLoading ? "Sending..." : "Forgot Password"}
        </button>
      </div>
    </div>
  );
}
