"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentCustomerSession } from "@/lib/customer-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function CartIconLink({ className = "" }: { className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      void (async () => {
        const supabase = createBrowserSupabaseClient();

        if (!supabase) {
          return;
        }

        const session = await getCurrentCustomerSession();

        if (!active || !session.customer) {
          return;
        }

        const { count: cartCount } = await supabase
          .from("cart_items")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", session.customer.id);

        if (active) {
          setCount(cartCount ?? 0);
        }
      })();
    });

    return () => {
      active = false;
    };
  }, []);

  const label = count ? `Order cart, ${count} item${count === 1 ? "" : "s"}` : "Order cart";

  return (
    <Link href="/cart" aria-label={label} title={label} className={`relative grid place-items-center rounded-sm bg-orange-50 text-orange-700 ring-1 ring-orange-200 hover:bg-orange-100 ${className}`}>
      <CartIcon />
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#f65f18] px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

function CartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
      <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" />
    </svg>
  );
}
