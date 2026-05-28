"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentCustomerSession, logoutCustomer, type CustomerProfile } from "@/lib/customer-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function CustomerAuthNav() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [fallbackName, setFallbackName] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let settled = false;
    const supabase = createBrowserSupabaseClient();

    const loadSession = async () => {
      const session = await getCurrentCustomerSession();

      if (!active) {
        return;
      }

      settled = true;
      setCustomer(session.customer);
      setFallbackName(session.user?.user_metadata?.full_name ?? session.user?.email ?? "");
      setLoading(false);
    };

    void loadSession();

    const timeout = window.setTimeout(() => {
      if (!active || settled) {
        return;
      }

      settled = true;
      setCustomer(null);
      setFallbackName("");
      setLoading(false);
    }, 6000);

    const subscription = supabase?.auth.onAuthStateChange(() => {
      void loadSession();
    });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    await logoutCustomer();
    setCustomer(null);
    setFallbackName("");
    setLogoutLoading(false);
    router.refresh();
  };

  if (loading) {
    return <span className="text-zinc-400">Checking account...</span>;
  }

  if (!customer && !fallbackName) {
    return (
      <>
        <Link href="/login" className="hover:text-orange-600">
          Login
        </Link>
        <span className="text-zinc-300">|</span>
        <Link href="/register" className="hover:text-orange-600">
          Register
        </Link>
      </>
    );
  }

  return (
    <>
      <span className="max-w-40 truncate font-black text-zinc-950">{customer?.name ?? fallbackName}</span>
      <button type="button" onClick={handleLogout} disabled={logoutLoading} className="font-bold text-zinc-500 hover:text-orange-600 disabled:cursor-wait disabled:opacity-60">
        {logoutLoading ? "Logging out..." : "Logout"}
      </button>
    </>
  );
}
