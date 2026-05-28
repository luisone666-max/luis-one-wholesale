"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FacebookQuickSignInButton, GoogleQuickSignInButton, isFacebookLoginEnabled } from "@/components/auth/GoogleQuickSignInButton";
import { getCurrentCustomerSession, getFriendlyAuthError, normalizeCustomerRedirect } from "@/lib/customer-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm({ registered = false, redirectPath, siteOrigin }: { registered?: boolean; redirectPath?: string; siteOrigin?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(false);
  const normalizedRedirect = normalizeCustomerRedirect(redirectPath, "/member");
  const isCheckoutRedirect = normalizedRedirect === "/checkout";
  const isCartRedirect = normalizedRedirect === "/cart";
  const isOrderRedirect = isCheckoutRedirect || isCartRedirect;
  const continuationLabel = isCheckoutRedirect ? "checkout" : isCartRedirect ? "your order cart" : "your wholesale account";
  const formTitle = isCheckoutRedirect ? "Login to Continue Checkout" : isCartRedirect ? "Login to Return to Cart" : "Login to Your Wholesale Account";
  const primaryTitle = isCheckoutRedirect ? "Continue to checkout" : isCartRedirect ? "Return to your order cart" : formTitle;
  const primaryCopy = isCheckoutRedirect
    ? "Use quick sign in and we will bring you back to checkout automatically."
    : isCartRedirect
      ? "Use quick sign in and we will bring you back to your order cart automatically."
      : "Access your Luis One Supply Hub order list and wholesale orders.";
  const loginButtonLabel = isCheckoutRedirect ? "Login and Continue to Checkout" : isCartRedirect ? "Login and Return to Cart" : "Login";
  const googleButtonLabel = isCheckoutRedirect ? "Continue to Checkout with Google" : isCartRedirect ? "Return to Cart with Google" : undefined;
  const facebookButtonLabel = isCheckoutRedirect ? "Continue to Checkout with Facebook" : isCartRedirect ? "Return to Cart with Facebook" : undefined;
  const emailSummaryLabel = isOrderRedirect ? "Use email and password instead" : "Email login";

  const getRedirectTarget = useCallback(
    () => normalizeCustomerRedirect(redirectPath || new URLSearchParams(window.location.search).get("redirect"), "/member"),
    [redirectPath],
  );

  useEffect(() => {
    let active = true;

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      return () => {
        active = false;
      };
    }

    const continueIfSignedIn = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active || !session?.user) {
        return;
      }

      const customerSession = await getCurrentCustomerSession({ ensureProfile: true });

      if (!active) {
        return;
      }

      if (!customerSession.customer) {
        setMessage("Login succeeded, but customer profile could not be created. Please contact us on Messenger.");
        setSuccessMessage(false);
        return;
      }

      const redirectTo = getRedirectTarget();
      router.replace(redirectTo);
      router.refresh();
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        queueMicrotask(() => {
          void continueIfSignedIn();
        });
      }
    });

    queueMicrotask(() => {
      void continueIfSignedIn();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [getRedirectTarget, router]);

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

    if (error) {
      setMessage(getFriendlyAuthError(error.message));
      setSuccessMessage(false);
      setLoading(false);
      return;
    }

    const session = await getCurrentCustomerSession({ ensureProfile: true });

    if (!session.customer) {
      setMessage("Login succeeded, but customer profile could not be loaded. Please contact us on Messenger.");
      setSuccessMessage(false);
      setLoading(false);
      return;
    }

    const redirectTo = getRedirectTarget();
    setSuccessMessage(true);
    setMessage(`Login successful. Opening ${continuationLabel}...`);
    router.replace(redirectTo);
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
    <div className="overflow-hidden rounded-sm border border-zinc-200 bg-white shadow-sm">
      <div className="p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">{isOrderRedirect ? "Fast checkout login" : "Wholesale account"}</p>
        <h2 className="mt-2 text-2xl font-black text-zinc-950">{primaryTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{primaryCopy}</p>
      {registered ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          Account created. Please login to continue.
        </p>
      ) : null}
        <div className="mt-5 rounded-sm border border-orange-100 bg-orange-50 p-4">
          <p className="text-sm font-black text-zinc-950">Quick sign in</p>
          <p className="mt-1 text-xs font-bold leading-5 text-zinc-500">
            No password needed when you use {isFacebookLoginEnabled ? "Google or Facebook" : "Google"}.
          </p>
          <div className="mt-3 grid gap-2">
            <GoogleQuickSignInButton redirectPath={normalizedRedirect} siteOrigin={siteOrigin} label={googleButtonLabel} />
            <FacebookQuickSignInButton redirectPath={normalizedRedirect} siteOrigin={siteOrigin} label={facebookButtonLabel} />
          </div>
          {isOrderRedirect ? (
            <p className="mt-3 text-center text-xs font-bold text-orange-700">
              After sign in, this page returns to {isCheckoutRedirect ? "checkout" : "your order cart"}.
            </p>
          ) : null}
        </div>
      </div>

      <details open={!isOrderRedirect} className="border-t border-zinc-100 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-sm font-black text-zinc-800 transition hover:bg-zinc-50">
          <span>{emailSummaryLabel}</span>
          <span className="text-lg leading-none text-orange-700">+</span>
        </summary>
        <div className="border-t border-zinc-100 px-6 py-5">
          <form onSubmit={submit} className="space-y-4">
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
              {loading ? `Opening ${continuationLabel}...` : loginButtonLabel}
            </button>
          </form>
          <button type="button" onClick={sendPasswordReset} disabled={resetLoading} className="mt-4 text-sm font-bold text-zinc-500 hover:text-orange-700 disabled:opacity-60">
            {resetLoading ? "Sending..." : "Forgot Password"}
          </button>
        </div>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50 px-6 py-4 text-sm">
        <span className="font-bold text-zinc-600">New customer?</span>
        <div className="flex flex-wrap items-center gap-4">
          <Link href={`/register?redirect=${encodeURIComponent(normalizedRedirect)}`} className="font-black text-orange-700">
            Create Account
          </Link>
          <Link href="/category/all" className="font-black text-zinc-600">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
