"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CustomerAuthGate } from "@/components/auth/CustomerAuthGate";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { customerCartItems, formatPhp, getTierForCustomerQuantity } from "@/lib/customer-mock-data";

export default function CartPage() {
  const [items, setItems] = useState(customerCartItems);
  const productTotal = items.reduce((sum, item) => {
    const tier = getTierForCustomerQuantity(item, item.quantity);
    return sum + tier.price * item.quantity;
  }, 0);

  const updateQuantity = (sku: string, quantity: number) => {
    setItems((current) => current.map((item) => (item.sku === sku ? { ...item, quantity: Math.max(1, quantity) } : item)));
  };

  return (
    <>
      <SiteHeader />
      <CustomerAuthGate>
        <main className="bg-zinc-50">
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 rounded-md border border-orange-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Wholesale order cart</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Review items before checkout</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                Quantity changes update the applied wholesale unit price. Order submission is still a mockup.
              </p>
            </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
              <div className="grid grid-cols-[96px_1fr_120px_120px_130px_100px] gap-4 border-b border-zinc-100 bg-zinc-50 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-500 max-lg:hidden">
                <span>Image</span>
                <span>Product</span>
                <span>Quantity</span>
                <span>Unit Price</span>
                <span>Subtotal</span>
                <span>Remove</span>
              </div>
              <div className="divide-y divide-zinc-100">
                {items.map((item) => {
                  const tier = getTierForCustomerQuantity(item, item.quantity);
                  const subtotal = tier.price * item.quantity;

                  return (
                    <div key={item.sku} className="grid gap-4 p-5 lg:grid-cols-[96px_1fr_120px_120px_130px_100px] lg:items-center">
                      <div className="h-24 w-24 rounded-md bg-orange-50 p-2">
                        <Image src={item.image} alt={item.name} width={120} height={120} className="h-full w-full object-contain" />
                      </div>
                      <div>
                        <Link href={`/product/${item.slug}`} className="font-black text-zinc-950 hover:text-orange-700">
                          {item.name}
                        </Link>
                        <p className="mt-2 text-sm font-bold text-zinc-500">{item.sku}</p>
                        <p className="mt-1 text-xs font-bold text-orange-700">{tier.label} applied</p>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => updateQuantity(item.sku, Number(event.target.value) || 1)}
                        className="h-11 rounded-md border border-zinc-200 px-3 text-center text-sm font-black outline-none focus:border-orange-500"
                      />
                      <p className="font-black text-orange-700">{formatPhp(tier.price)}</p>
                      <p className="text-lg font-black text-zinc-950">{formatPhp(subtotal)}</p>
                      <button
                        type="button"
                        onClick={() => setItems((current) => current.filter((currentItem) => currentItem.sku !== item.sku))}
                        className="h-10 rounded-md border border-red-200 px-3 text-sm font-black text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="h-fit rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-zinc-950">Order Summary</h2>
              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Product Total" value={formatPhp(productTotal)} />
                <SummaryRow label="Shipping Fee" value="To be confirmed / Freight Collect" />
                <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-700">
                  If shipping is freight collect, shipping fee is paid by receiver and is not added to product total.
                </div>
                <div className="border-t border-zinc-100 pt-4">
                  <SummaryRow label="Amount to Confirm" value={formatPhp(productTotal)} strong />
                </div>
              </div>
              <Link href="/checkout" className="mt-6 block rounded-md bg-[#f65f18] px-5 py-3 text-center text-sm font-black text-white">
                Proceed to Checkout
              </Link>
            </aside>
          </div>
          </section>
        </main>
      </CustomerAuthGate>
      <SiteFooter />
    </>
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
