"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentCustomerSession, logoutCustomer, type CustomerProfile } from "@/lib/customer-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function CustomerAuthNav() {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [fallbackName, setFallbackName] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createBrowserSupabaseClient();

    const loadSession = async () => {
      const session = await getCurrentCustomerSession();

      if (!active) {
        return;
      }

      setCustomer(session.customer);
      setFallbackName(session.user?.user_metadata?.full_name ?? session.user?.email ?? "");
      setLoading(false);
    };

    void loadSession();

    const subscription = supabase?.auth.onAuthStateChange(() => {
      void loadSession();
    });

    return () => {
      active = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await logoutCustomer();
    setCustomer(null);
    setFallbackName("");
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
      <button type="button" onClick={handleLogout} className="font-bold text-zinc-500 hover:text-orange-600">
        Logout
      </button>
    </>
  );
}
