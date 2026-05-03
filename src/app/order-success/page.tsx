"use client";

import { CustomerAuthGate } from "@/components/auth/CustomerAuthGate";
import { OrderSuccessDetails } from "@/components/OrderSuccessDetails";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function OrderSuccessPage() {
  return (
    <>
      <SiteHeader />
      <CustomerAuthGate>
        <main className="bg-zinc-50">
          <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
            <OrderSuccessDetails />
          </section>
        </main>
      </CustomerAuthGate>
      <SiteFooter />
    </>
  );
}
