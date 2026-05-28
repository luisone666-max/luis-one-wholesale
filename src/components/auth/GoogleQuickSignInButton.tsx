"use client";

import { useState } from "react";
import { getFriendlyAuthError, normalizeCustomerRedirect } from "@/lib/customer-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function GoogleQuickSignInButton({
  redirectPath,
  label = "Continue with Google",
  className = "",
}: {
  redirectPath?: string;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const startGoogleLogin = async () => {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setMessage("Supabase Auth is not configured yet. Please check environment variables.");
      return;
    }

    setLoading(true);
    setMessage("");

    const currentPath = `${window.location.pathname}${window.location.search}`;
    const redirectFromQuery = new URLSearchParams(window.location.search).get("redirect");
    const isAuthPage = window.location.pathname === "/login" || window.location.pathname === "/register";
    const redirectTarget = normalizeCustomerRedirect(redirectPath || redirectFromQuery || (isAuthPage ? "/member" : currentPath));
    const callbackUrl = new URL("/login", window.location.origin);
    callbackUrl.searchParams.set("redirect", redirectTarget);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setMessage(getFriendlyAuthError(error.message));
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={startGoogleLogin}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-sm border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-wait disabled:opacity-70"
      >
        <GoogleIcon />
        <span>{loading ? "Opening Google..." : label}</span>
      </button>
      {message ? <p className="mt-2 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{message}</p> : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.2 3-7.2Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z" />
      <path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.9 5.6l3.3 2.6C7.2 7.9 9.4 6.1 12 6.1Z" />
    </svg>
  );
}
