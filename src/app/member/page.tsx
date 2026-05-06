"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CustomerAuthGate } from "@/components/auth/CustomerAuthGate";
import { messengerUrl } from "@/components/CustomerUi";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  getCustomerLoyaltyTransactions,
  getCustomerMemberSummary,
  type CustomerLoyaltyTransaction,
  type CustomerMemberSummary,
} from "@/lib/customer-member";
import { formatPhp } from "@/lib/wholesale-pricing";

export default function MemberPage() {
  return (
    <>
      <SiteHeader />
      <CustomerAuthGate>
        <MemberContent />
      </CustomerAuthGate>
      <SiteFooter />
    </>
  );
}

function MemberContent() {
  const [member, setMember] = useState<CustomerMemberSummary | null>(null);
  const [transactions, setTransactions] = useState<CustomerLoyaltyTransaction[]>([]);
  const [pointsReady, setPointsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      void (async () => {
        const [memberResult, loyaltyResult] = await Promise.all([
          getCustomerMemberSummary(),
          getCustomerLoyaltyTransactions(),
        ]);

        if (!active) {
          return;
        }

        setMember(memberResult.member);
        setTransactions(loyaltyResult.transactions);
        setPointsReady(loyaltyResult.pointsReady);
        setMessage(memberResult.error ?? loyaltyResult.error ?? "");
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
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="overflow-hidden rounded-sm border border-orange-100 bg-white shadow-sm">
            <div className="bg-[#f65f18] px-5 py-5 text-white sm:px-7">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-100">Luis One Member</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Wholesale Member Card</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-orange-50">
                Earn points after confirmed payments from online orders and offline store purchases.
              </p>
            </div>

            <div className="p-5 sm:p-7">
              {loading ? (
                <p className="text-sm font-bold text-zinc-600">Loading member details...</p>
              ) : null}

              {message ? (
                <div className="mb-5 rounded-sm border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-700">
                  {message}
                </div>
              ) : null}

              {member ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div>
                      <p className="text-sm font-black text-zinc-500">Member Name</p>
                      <h2 className="mt-1 text-2xl font-black text-zinc-950">{member.name}</h2>
                      <p className="mt-2 text-sm font-bold text-zinc-500">
                        {member.phone || "No phone saved"}{member.businessType ? ` / ${member.businessType}` : ""}
                      </p>
                    </div>
                    <div className="rounded-sm bg-zinc-950 px-4 py-3 text-right text-white">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-300">Rule</p>
                      <p className="mt-1 text-sm font-black">Every PHP 100 paid = 1 point</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <PointBox label="Available Points" value={pointsReady ? member.pointsBalance : null} tone="green" />
                    <PointBox label="Lifetime Points" value={pointsReady ? member.lifetimePoints : null} tone="orange" />
                  </div>

                  <div className="mt-6 rounded-sm border border-zinc-200 bg-zinc-50 p-4">
                    <h3 className="font-black text-zinc-950">How points work</h3>
                    <ul className="mt-3 space-y-2 text-sm font-bold leading-6 text-zinc-600">
                      <li>Points are added only after payment is confirmed by our team.</li>
                      <li>Online wholesale orders and offline store sales can both earn points.</li>
                      <li>Redemption rules are confirmed manually before use.</li>
                    </ul>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/category/all" className="rounded-sm bg-[#f65f18] px-5 py-3 text-sm font-black text-white">
                      Continue Shopping
                    </Link>
                    <Link href="/my-orders" className="rounded-sm border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-black text-orange-700">
                      View My Orders
                    </Link>
                    <a href={messengerUrl} target="_blank" rel="noreferrer" className="rounded-sm border border-zinc-200 bg-white px-5 py-3 text-sm font-black text-zinc-700">
                      Chat on Messenger
                    </a>
                  </div>
                </>
              ) : !loading ? (
                <div className="rounded-sm border border-zinc-200 bg-zinc-50 p-5 text-sm font-bold text-zinc-600">
                  Member profile is not available yet. Please contact us if your account was just created.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Points Activity</p>
                <h2 className="mt-1 text-xl font-black text-zinc-950">Recent member points</h2>
              </div>
              <p className="text-xs font-bold text-zinc-500">Latest 20 records</p>
            </div>

            {loading ? (
              <p className="mt-5 text-sm font-bold text-zinc-600">Loading points activity...</p>
            ) : null}

            {!loading && !transactions.length ? (
              <div className="mt-5 rounded-sm border border-dashed border-orange-200 bg-orange-50 p-5">
                <h3 className="font-black text-zinc-950">No points yet</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-zinc-600">
                  After an order or offline sale is paid and confirmed, your points activity will appear here.
                </p>
              </div>
            ) : null}

            {transactions.length ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">Paid Amount</th>
                      <th className="px-3 py-2">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-3 py-3 text-zinc-600">{formatDate(transaction.createdAt)}</td>
                        <td className="px-3 py-3 font-bold text-zinc-700">{formatSourceType(transaction.sourceType)}</td>
                        <td className="px-3 py-3 font-black text-orange-700">{formatPhp(transaction.amount)}</td>
                        <td className="px-3 py-3 font-black text-emerald-700">+{transaction.points.toLocaleString("en-US")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}

function PointBox({ label, value, tone }: { label: string; value: number | null; tone: "green" | "orange" }) {
  const toneClass = tone === "green"
    ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
    : "bg-orange-50 text-orange-800 ring-orange-100";

  return (
    <div className={`rounded-sm p-4 text-center ring-1 ${toneClass}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-2 text-3xl font-black">{value === null ? "-" : value.toLocaleString("en-US")}</p>
    </div>
  );
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
