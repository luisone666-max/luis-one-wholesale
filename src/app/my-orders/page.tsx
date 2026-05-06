"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { CustomerAuthGate } from "@/components/auth/CustomerAuthGate";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  getCustomerLoyaltyTransactions,
  getCustomerMemberSummary,
  type CustomerLoyaltyTransaction,
  type CustomerMemberSummary,
} from "@/lib/customer-member";
import { getCustomerOrders, type CustomerOrderSummary } from "@/lib/customer-orders";
import { calculateLoyaltyPoints, formatLoyaltyPoints } from "@/lib/loyalty-points";
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
  const [member, setMember] = useState<CustomerMemberSummary | null>(null);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<CustomerLoyaltyTransaction[]>([]);
  const [loyaltyPointsReady, setLoyaltyPointsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      void (async () => {
        const [ordersResult, memberResult, loyaltyResult] = await Promise.all([
          getCustomerOrders(),
          getCustomerMemberSummary(),
          getCustomerLoyaltyTransactions(),
        ]);

        if (!active) {
          return;
        }

        setOrders(ordersResult.orders);
        setMember(memberResult.member);
        setLoyaltyTransactions(loyaltyResult.transactions);
        setLoyaltyPointsReady(loyaltyResult.pointsReady);
        setMessage(ordersResult.error ?? memberResult.error ?? loyaltyResult.error ?? "");
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
        {member ? (
          <section className="mb-6 grid gap-3 rounded-sm border border-emerald-100 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Wholesale Member Card</p>
              <h2 className="mt-1 text-xl font-black text-zinc-950">{member.name}</h2>
              <p className="mt-1 text-sm font-bold text-zinc-500">
                {member.phone || "No phone saved"}{member.businessType ? ` / ${member.businessType}` : ""}
              </p>
              <p className="mt-2 text-xs font-bold text-zinc-500">Points are added after payment confirmation. Every PHP 100 paid = 1 point.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center sm:min-w-[260px]">
              <div className="rounded-sm bg-emerald-50 p-3 ring-1 ring-emerald-100">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">Balance</p>
                <p className="mt-1 text-2xl font-black text-emerald-800">{member.pointsReady ? member.pointsBalance?.toLocaleString("en-US") : "-"}</p>
              </div>
              <div className="rounded-sm bg-orange-50 p-3 ring-1 ring-orange-100">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-700">Lifetime</p>
                <p className="mt-1 text-2xl font-black text-orange-800">{member.pointsReady ? member.lifetimePoints?.toLocaleString("en-US") : "-"}</p>
              </div>
            </div>
          </section>
        ) : null}
        {loyaltyPointsReady && loyaltyTransactions.length ? (
          <section className="mb-6 rounded-sm border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Recent Points Activity</p>
                <h2 className="mt-1 text-lg font-black text-zinc-950">Member points history</h2>
              </div>
              <p className="text-xs font-bold text-zinc-500">Points are final after cashier or admin payment confirmation.</p>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Paid Amount</th>
                    <th className="px-3 py-2">Points</th>
                    <th className="px-3 py-2">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loyaltyTransactions.slice(0, 5).map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-3 py-3 text-zinc-600">{formatDate(transaction.createdAt)}</td>
                      <td className="px-3 py-3 font-bold text-zinc-700">{formatSourceType(transaction.sourceType)}</td>
                      <td className="px-3 py-3 font-black text-orange-700">{formatPhp(transaction.amount)}</td>
                      <td className="px-3 py-3 font-black text-emerald-700">+{transaction.points.toLocaleString("en-US")}</td>
                      <td className="px-3 py-3 text-zinc-600">{transaction.note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
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
                      <td className="px-4 py-4">
                        <p className="font-black text-orange-700">{formatPhp(order.productTotal)}</p>
                        <p className="mt-1 text-xs font-bold text-emerald-700">
                          {formatLoyaltyPoints(calculateLoyaltyPoints(order.productTotal))} after payment confirmation
                        </p>
                      </td>
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

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSourceType(value: string) {
  if (value === "online_order") {
    return "Online order";
  }

  if (value === "offline_sale" || value === "pos_sale") {
    return "Offline sale";
  }

  return "Manual adjustment";
}
