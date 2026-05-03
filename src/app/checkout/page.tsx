"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { customerCartItems, formatPhp, getTierForCustomerQuantity } from "@/lib/customer-mock-data";

const receivingMethods = ["Pick up at store", "Local delivery / Lalamove", "Courier shipping", "To be arranged"];
const shippingOptions = [
  "Freight Collect / Paid by Receiver",
  "Prepaid Shipping",
  "To be Confirmed",
  "Pick-up / No Shipping Fee",
];

export default function CheckoutPage() {
  const productTotal = customerCartItems.reduce((sum, item) => {
    const tier = getTierForCustomerQuantity(item, item.quantity);
    return sum + tier.price * item.quantity;
  }, 0);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receivingMethod, setReceivingMethod] = useState("Courier shipping");
  const [address, setAddress] = useState("");
  const [shippingPayment, setShippingPayment] = useState("Freight Collect / Paid by Receiver");

  const addressRequired = receivingMethod === "Local delivery / Lalamove" || receivingMethod === "Courier shipping";
  const errors = useMemo(
    () => ({
      receiverName: !receiverName,
      receiverPhone: !receiverPhone,
      receivingMethod: !receivingMethod,
      address: addressRequired && !address,
    }),
    [address, addressRequired, receiverName, receiverPhone, receivingMethod],
  );

  const changeReceivingMethod = (method: string) => {
    setReceivingMethod(method);
    if (method === "Pick up at store") {
      setShippingPayment("Pick-up / No Shipping Fee");
    }
    if (method === "Courier shipping") {
      setShippingPayment("Freight Collect / Paid by Receiver");
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="bg-zinc-50">
        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
          <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Checkout mockup</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Receiver and shipping details</h1>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Receiver Name" value={receiverName} onChange={setReceiverName} error={errors.receiverName} />
              <Field label="Receiver Phone Number" value={receiverPhone} onChange={setReceiverPhone} error={errors.receiverPhone} />
              <label className="block text-sm font-bold text-zinc-800">
                Receiving Method
                <select
                  value={receivingMethod}
                  onChange={(event) => changeReceivingMethod(event.target.value)}
                  className="mt-2 h-12 w-full rounded-md border border-zinc-200 bg-white px-4 outline-none focus:border-orange-500"
                >
                  {receivingMethods.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold text-zinc-800">
                Shipping Fee Payment
                <select
                  value={shippingPayment}
                  onChange={(event) => setShippingPayment(event.target.value)}
                  className="mt-2 h-12 w-full rounded-md border border-zinc-200 bg-white px-4 outline-none focus:border-orange-500"
                >
                  {shippingOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold text-zinc-800 sm:col-span-2">
                Complete Address {addressRequired ? <span className="text-red-600">*</span> : <span className="text-zinc-400">(optional)</span>}
                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className={`mt-2 min-h-24 w-full rounded-md border px-4 py-3 outline-none focus:border-orange-500 ${
                    errors.address ? "border-red-300 bg-red-50" : "border-zinc-200"
                  }`}
                />
                {errors.address ? <span className="mt-1 block text-xs font-bold text-red-600">Complete Address is required for delivery or courier shipping.</span> : null}
              </label>
              <label className="block text-sm font-bold text-zinc-800 sm:col-span-2">
                Order Notes
                <textarea className="mt-2 min-h-24 w-full rounded-md border border-zinc-200 px-4 py-3 outline-none focus:border-orange-500" />
              </label>
            </div>
          </div>

          <aside className="h-fit rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-zinc-950">Amount to Confirm</h2>
            <div className="mt-5 space-y-3 text-sm">
              <SummaryRow label="Product Total" value={formatPhp(productTotal)} />
              <SummaryRow label="Shipping Fee Payment" value={shippingPayment} />
              <SummaryRow
                label="Shipping Fee"
                value={shippingPayment === "Freight Collect / Paid by Receiver" ? "Paid by receiver" : shippingPayment === "Pick-up / No Shipping Fee" ? "PHP 0" : "To be confirmed"}
              />
              <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-700">
                Freight collect is not added to product total. Shipping and pickup are arranged manually.
              </div>
              <div className="border-t border-zinc-100 pt-4">
                <SummaryRow label="Amount to Confirm" value={formatPhp(productTotal)} strong />
              </div>
            </div>
            <Link href="/order-success" className="mt-6 block rounded-md bg-[#f65f18] px-5 py-3 text-center text-sm font-black text-white">
              Place Order Mockup
            </Link>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: boolean;
}) {
  return (
    <label className="block text-sm font-bold text-zinc-800">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 h-12 w-full rounded-md border px-4 outline-none focus:border-orange-500 ${error ? "border-red-300 bg-red-50" : "border-zinc-200"}`}
      />
      {error ? <span className="mt-1 block text-xs font-bold text-red-600">{label} required</span> : null}
    </label>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className={strong ? "font-black text-zinc-950" : "text-zinc-600"}>{label}</span>
      <span className={strong ? "text-xl font-black text-[#f65f18]" : "font-bold text-zinc-950"}>{value}</span>
    </div>
  );
}
