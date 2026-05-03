"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { CustomerAuthGate } from "@/components/auth/CustomerAuthGate";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCustomerOrders, type CustomerOrderSummary } from "@/lib/customer-orders";
import { getOrderStatusLabel, getPaymentStatusLabel, getReceivingMethodLabel } from "@/lib/order-labels";
import { formatPhp } from "@/lib/wholesale-pricing";

export default function MyOrdersPage() {
  return (
    <>
      <SiteHeader />
      <CustomerAuthGate>
        <MyOrdersContent />
      </CustomerAuthGate>
      <SiteFooter />
    </>
  );
}

function MyOrdersContent() {
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      void (async () => {
        const result = await getCustomerOrders();

        if (!active) {
          return;
        }

        setOrders(result.orders);
        setMessage(result.error ?? "");
        setLoading(false);
      })();
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="bg-zinc-50">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-sm border border-orange-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">My Orders</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Wholesale order history</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Track submitted wholesale orders and manual confirmation status.</p>
        </div>
        <div className="overflow-hidden rounded-sm border border-zinc-200 bg-white shadow-sm">
          {loading ? <div className="p-6 text-sm font-bold text-zinc-600">Loading orders...</div> : null}
          {message ? <div className="m-5 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-700">{message}</div> : null}
          {!loading && !orders.length ? (
            <div className="p-8 text-center">
              <h2 className="text-xl font-black text-zinc-950">No orders yet</h2>
              <p className="mt-2 text-sm text-zinc-600">Submit an order from your cart to see it here.</p>
              <Link href="/category/all" className="mt-5 inline-flex rounded-md bg-[#f65f18] px-5 py-3 text-sm font-black text-white">
                Continue Shopping
              </Link>
            </div>
          ) : null}
          {orders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Order No</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Product Total</th>
                    <th className="px-4 py-3">Order Status</th>
                    <th className="px-4 py-3">Payment Status</th>
                    <th className="px-4 py-3">Receiving Method</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-4 font-black text-zinc-950">{order.orderNo}</td>
                      <td className="px-4 py-4 text-zinc-600">{order.date}</td>
                      <td className="px-4 py-4 font-black text-orange-700">{formatPhp(order.productTotal)}</td>
                      <td className="px-4 py-4">
                        <Pill>{getOrderStatusLabel(order.orderStatus)}</Pill>
                      </td>
                      <td className="px-4 py-4">
                        <Pill>{getPaymentStatusLabel(order.paymentStatus)}</Pill>
                      </td>
                      <td className="px-4 py-4 text-zinc-600">{getReceivingMethodLabel(order.receivingMethod)}</td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/my-orders/${order.orderNo}`}
                          className="rounded-sm border border-orange-200 px-3 py-2 text-xs font-black text-orange-700"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-sm bg-orange-50 px-2 py-1 text-xs font-black text-orange-700 ring-1 ring-orange-100">{children}</span>;
}
