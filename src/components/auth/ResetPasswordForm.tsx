"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { getFriendlyAuthError } from "@/lib/customer-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setMessage("Supabase Auth is not configured yet. Please check environment variables.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage(getFriendlyAuthError(error.message));
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setSuccess(true);
    setMessage("Password updated. You can login with your new password.");
  };

  return (
    <div className="rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-zinc-950">Set a New Password</h2>
      <p className="mt-2 text-sm text-zinc-600">Enter your new Luis One Supply Hub account password.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-bold text-zinc-800">
          New Password
          <input
            type="password"
            value={password}
            required
            placeholder="At least 8 characters"
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 h-12 w-full rounded-sm border border-zinc-200 px-4 outline-none focus:border-orange-500"
          />
        </label>
        <label className="block text-sm font-bold text-zinc-800">
          Confirm New Password
          <input
            type="password"
            value={confirmPassword}
            required
            placeholder="Re-enter new password"
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-2 h-12 w-full rounded-sm border border-zinc-200 px-4 outline-none focus:border-orange-500"
          />
        </label>
        {message ? (
          <p className={`rounded-md border px-4 py-3 text-sm font-bold ${success ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-sm bg-[#f65f18] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-orange-300"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/login" className="font-black text-orange-700">
          Back to Login
        </Link>
        <Link href="/category/all" className="font-black text-zinc-600">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
