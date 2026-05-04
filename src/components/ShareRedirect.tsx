"use client";

import Link from "next/link";
import { useEffect } from "react";

export function ShareRedirect({ productUrl }: { productUrl: string }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      window.location.replace(productUrl);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [productUrl]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <section className="w-full max-w-md rounded-sm border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Luis One Supply Hub</p>
        <h1 className="mt-3 text-2xl font-black text-zinc-950">Opening product page</h1>
        <p className="mt-3 text-sm font-bold leading-6 text-zinc-500">
          You are being redirected to the product details.
        </p>
        <Link
          href={productUrl}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-sm bg-[#f65f18] px-5 text-sm font-black text-white hover:bg-[#df4f0d]"
        >
          Open Product
        </Link>
      </section>
    </main>
  );
}
