"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FacebookQuickSignInButton, GoogleQuickSignInButton, isFacebookLoginEnabled } from "@/components/auth/GoogleQuickSignInButton";
import { getCurrentCustomerSession } from "@/lib/customer-auth";
import { createBrowserSupabaseClient, hasCachedBrowserSupabaseSession } from "@/lib/supabase/client";

export function CustomerAuthGate({ children, redirectToLogin = false }: { children: ReactNode; redirectToLogin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(() => hasCachedBrowserSupabaseSession());
  const [checking, setChecking] = useState(false);
  const shouldRedirectToLogin = !checking && !loggedIn && redirectToLogin;

  useEffect(() => {
    if (!checking) {
      return;
    }

    const fallback = window.setTimeout(() => {
      setLoggedIn(false);
      setChecking(false);
    }, 3500);

    return () => {
      window.clearTimeout(fallback);
    };
  }, [checking]);

  useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof createBrowserSupabaseClient> = null;

    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      supabase = null;
    }

    const checkSession = async () => {
      let isLoggedIn = false;

      try {
        const session = await getCurrentCustomerSession();
        isLoggedIn = Boolean(session.user);
      } catch {
        isLoggedIn = false;
      }

      if (!active) {
        return;
      }

      setLoggedIn(isLoggedIn);
      setChecking(false);
    };

    void checkSession();

    const subscription = supabase?.auth.onAuthStateChange(() => {
      void checkSession();
    });

    return () => {
      active = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!shouldRedirectToLogin) {
      return;
    }

    const currentPath = `${pathname}${window.location.search}`;
    router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }, [pathname, router, shouldRedirectToLogin]);

  if (checking) {
    return (
      <main className="bg-zinc-50">
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-md border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Secure account</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">Loading your account...</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">Checking your customer session.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!loggedIn && redirectToLogin) {
    const redirect = typeof window === "undefined" ? encodeURIComponent(pathname) : encodeURIComponent(`${pathname}${window.location.search}`);

    return (
      <main className="bg-zinc-50">
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-md border border-orange-100 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Secure login</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">Login to continue your order.</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {checking ? "Checking your customer session. If login is needed, this will continue automatically." : "Opening secure login automatically. If it does not open, use the button below."}
            </p>
            <div className="mt-6 flex justify-center">
              <Link href={`/login?redirect=${redirect}`} className="rounded-md bg-[#f65f18] px-5 py-3 text-sm font-black text-white">
                Continue to Login
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!loggedIn) {
    const redirect = encodeURIComponent(pathname);

    return (
      <main className="bg-zinc-50">
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-md border border-orange-100 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Login required</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">Please login or register to place order.</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Product prices remain public, but cart, checkout, and order history require a customer account.
            </p>
            <div className="mx-auto mt-6 grid max-w-sm gap-2">
              <GoogleQuickSignInButton label="Quick Sign In with Google" />
              {isFacebookLoginEnabled ? <FacebookQuickSignInButton label="Quick Sign In with Facebook" /> : null}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href={`/login?redirect=${redirect}`} className="rounded-md bg-[#f65f18] px-5 py-3 text-sm font-black text-white">
                Login
              </Link>
              <Link href="/register" className="rounded-md border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-black text-orange-700">
                Register
              </Link>
              <Link href="/category/all" className="rounded-md border border-zinc-200 bg-white px-5 py-3 text-sm font-black text-zinc-700">
                Continue Shopping
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return children;
}
