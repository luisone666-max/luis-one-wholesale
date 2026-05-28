"use client";

import { CustomerAuthGate } from "@/components/auth/CustomerAuthGate";
import { CheckoutForm } from "@/components/CheckoutForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <CustomerAuthGate redirectToLogin>
        <CheckoutForm />
      </CustomerAuthGate>
      <SiteFooter />
    </>
  );
}
