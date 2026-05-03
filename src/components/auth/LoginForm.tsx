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
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setMessage("Supabase Auth is not configured yet. Please check environment variables.");
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
      return;
    }

    const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/";
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-zinc-950">Buyer Login</h2>
      <p className="mt-2 text-sm text-zinc-600">Login with your customer email and password.</p>
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
            className="mt-2 h-12 w-full rounded-md border border-zinc-200 px-4 outline-none focus:border-orange-500"
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
            className="mt-2 h-12 w-full rounded-md border border-zinc-200 px-4 outline-none focus:border-orange-500"
          />
        </label>
        {message ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-md bg-[#f65f18] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-orange-300"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div className="mt-5 flex items-center justify-between text-sm">
        <Link href="/register" className="font-black text-orange-700">
          Create Account
        </Link>
        <button type="button" className="font-bold text-zinc-500">
          Forgot Password
        </button>
      </div>
    </div>
  );
}
