"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getFriendlyAuthError } from "@/lib/customer-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm({ registered = false }: { registered?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(false);

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

    const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/";
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
