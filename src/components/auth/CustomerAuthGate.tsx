"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getCurrentCustomerSession } from "@/lib/customer-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function CustomerAuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createBrowserSupabaseClient();

    const checkSession = async () => {
      const session = await getCurrentCustomerSession();

      if (!active) {
        return;
      }

      setLoggedIn(Boolean(session.user));
      setLoading(false);
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

  if (loading) {
    return (
      <main className="bg-zinc-50">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-zinc-600">Checking customer session...</p>
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

