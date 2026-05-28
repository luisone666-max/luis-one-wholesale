"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CustomerAuthGate } from "@/components/auth/CustomerAuthGate";
import { MessengerIcon } from "@/components/BrandActionIcons";
import { messengerUrl } from "@/components/CustomerUi";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { businessInfo } from "@/lib/business-info";
import {
  getCustomerLoyaltyTransactions,
  getCustomerMemberSummary,
  type CustomerLoyaltyTransaction,
  type CustomerMemberSummary,
} from "@/lib/customer-member";
import { getCustomerOrders, type CustomerOrderSummary } from "@/lib/customer-orders";
import { formatPhp } from "@/lib/wholesale-pricing";

type IconName = "points" | "orders" | "history" | "support" | "clock" | "box" | "truck" | "check" | "x" | "bag" | "map";
type Tone = "orange" | "pink" | "sky" | "emerald" | "zinc";

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
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [transactions, setTransactions] = useState<CustomerLoyaltyTransaction[]>([]);
  const [pointsReady, setPointsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      void (async () => {
        const [memberResult, ordersResult, loyaltyResult] = await Promise.all([
          getCustomerMemberSummary(),
          getCustomerOrders(),
          getCustomerLoyaltyTransactions(),
        ]);

        if (!active) {
          return;
        }

        setMember(memberResult.member);
        setOrders(ordersResult.orders);
        setTransactions(loyaltyResult.transactions);
        setPointsReady(loyaltyResult.pointsReady);
        setMessage(memberResult.error ?? ordersResult.error ?? loyaltyResult.error ?? "");
        setLoading(false);
      })();
    });

    return () => {
      active = false;
    };
  }, []);

  const orderCounts = getOrderCounts(orders);
  const pointsValue = member?.pointsReady ? member.pointsBalance ?? 0 : null;
  const lifetimeValue = member?.pointsReady ? member.lifetimePoints ?? 0 : null;
  const recentTransactions = transactions.slice(0, 5);
  const displayName = member?.name || "Luis One Member";
  const memberMeta = [member?.phone, member?.businessType].filter(Boolean).join(" / ");
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessInfo.address)}`;

  return (
    <main className="bg-[#f5f5f5]">
      <section className="mx-auto max-w-5xl px-4 pb-8 pt-4 sm:px-6 sm:pt-8">
        <section className="overflow-hidden rounded-b-md bg-[#f65f18] px-4 pb-14 pt-5 text-white shadow-sm sm:px-8 sm:pb-16 sm:pt-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-white/60 sm:h-20 sm:w-20">
                <Image
                  src="/brand/luis-one-logo.jpg"
                  alt="Luis One Supply Hub logo"
                  width={80}
                  height={80}
                  priority
                  className="h-full w-full object-cover"
                />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-100">Wholesale Account</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight sm:text-2xl">{loading ? "Loading..." : displayName}</h1>
                <p className="mt-1 truncate text-xs font-bold text-orange-50 sm:text-sm">
                  {memberMeta || businessInfo.name}
                </p>
              </div>
            </div>
            <Link
              href="/my-orders"
              aria-label="Open my orders"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/10"
            >
              <DashboardIcon name="orders" className="h-5 w-5" />
            </Link>
          </div>
        </section>

        <section className="-mt-10 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 divide-x divide-y divide-zinc-100 sm:grid-cols-4 sm:divide-y-0">
            <SummaryTile icon="points" tone="orange" label="Points" value={formatStat(pointsValue)} subLabel="Available" />
            <SummaryTile icon="orders" tone="pink" label="Orders" value={orders.length.toLocaleString("en-US")} subLabel="Total" />
            <SummaryTile icon="history" tone="sky" label="History" value={transactions.length.toLocaleString("en-US")} subLabel="Records" />
            <SummaryTile icon="support" tone="emerald" label="Support" value="Messenger" subLabel="Online" />
          </div>
        </section>

        {message ? (
          <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
            {message}
          </div>
        ) : null}

        <section className="mt-4 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 sm:px-5">
            <h2 className="text-base font-bold text-zinc-950">My Orders</h2>
            <Link href="/my-orders" className="text-xs font-bold text-zinc-400 transition hover:text-orange-700">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-y-1 px-2 py-4 sm:grid-cols-5 sm:px-4">
            <OrderStatusItem icon="clock" label="To Confirm" count={orderCounts.toConfirm} tone="zinc" />
            <OrderStatusItem icon="box" label="Processing" count={orderCounts.processing} tone="zinc" />
            <OrderStatusItem icon="truck" label="To Receive" count={orderCounts.toReceive} tone="zinc" />
            <OrderStatusItem icon="check" label="Completed" count={orderCounts.completed} tone="zinc" />
            <OrderStatusItem icon="x" label="Cancelled" count={orderCounts.cancelled} tone="zinc" />
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
          <MenuRow href="/my-orders" icon="orders" label="My Orders" value={`${orders.length} orders`} />
          <MenuRow href="#points-activity" icon="points" label="Member Points" value={formatStat(lifetimeValue)} />
          <MenuRow href="/category/all" icon="bag" label="Browse Products" value="All products" />
          <MenuRow href={mapHref} icon="map" label="Store Address" value="Tondo, Manila" external />
          <MenuRow href={messengerUrl} icon="support" label="Messenger Support" value="Open chat" external messenger />
        </section>

        <section id="points-activity" className="mt-4 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 sm:px-5">
            <h2 className="text-base font-bold text-zinc-950">Points Activity</h2>
            <span className="text-xs font-bold text-zinc-400">{pointsReady ? "Ready" : "Pending"}</span>
          </div>

          {loading ? (
            <div className="p-5 text-sm font-bold text-zinc-600">Loading points activity...</div>
          ) : null}

          {!loading && !recentTransactions.length ? (
            <div className="p-5 text-sm font-bold text-zinc-500">No points records yet.</div>
          ) : null}

          {recentTransactions.length ? (
            <div className="divide-y divide-zinc-100">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
                  <div>
                    <p className="text-sm font-bold text-zinc-950">{formatSourceType(transaction.sourceType)}</p>
                    <p className="mt-1 text-xs font-semibold text-zinc-500">{formatDate(transaction.createdAt)}</p>
                  </div>
                  <div className="text-sm font-black text-emerald-700">
                    +{transaction.points.toLocaleString("en-US")} pts
                    <span className="ml-2 text-xs font-bold text-zinc-400">{formatPhp(transaction.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function SummaryTile({ icon, tone, label, value, subLabel }: { icon: IconName; tone: Tone; label: string; value: string; subLabel: string }) {
  return (
    <div className="flex min-h-[112px] flex-col items-center justify-center px-3 py-4 text-center">
      <IconBadge icon={icon} tone={tone} />
      <p className="mt-2 text-sm font-bold text-zinc-950">{label}</p>
      <p className="mt-1 text-xs font-semibold text-zinc-400">{value} {subLabel}</p>
    </div>
  );
}

function OrderStatusItem({ icon, label, count, tone }: { icon: IconName; label: string; count: number; tone: Tone }) {
  return (
    <Link href="/my-orders" className="group flex min-h-[88px] flex-col items-center justify-center rounded-sm px-2 py-3 text-center transition hover:bg-orange-50">
      <IconBadge icon={icon} tone={tone} small />
      <p className="mt-2 text-xs font-semibold text-zinc-600 group-hover:text-orange-700">{label}</p>
      {count > 0 ? <p className="mt-1 text-[11px] font-black text-orange-700">{count}</p> : null}
    </Link>
  );
}

function MenuRow({
  href,
  icon,
  label,
  value,
  external = false,
  messenger = false,
}: {
  href: string;
  icon: IconName;
  label: string;
  value: string;
  external?: boolean;
  messenger?: boolean;
}) {
  const content = (
    <>
      <span className="grid h-8 w-8 shrink-0 place-items-center text-orange-600">
        {messenger ? <MessengerIcon className="h-4 w-4" /> : <DashboardIcon name={icon} className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-zinc-950">{label}</span>
      </span>
      <span className="truncate text-xs font-semibold text-zinc-400">{value}</span>
      <span aria-hidden="true" className="text-zinc-300">&gt;</span>
    </>
  );

  const className = "flex min-h-12 items-center gap-3 border-b border-zinc-100 px-4 py-3 transition last:border-b-0 hover:bg-zinc-50 sm:px-5";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function IconBadge({ icon, tone, small = false }: { icon: IconName; tone: Tone; small?: boolean }) {
  const toneClass = {
    orange: "bg-orange-50 text-[#f65f18]",
    pink: "bg-rose-50 text-rose-500",
    sky: "bg-sky-50 text-sky-500",
    emerald: "bg-emerald-50 text-emerald-500",
    zinc: "bg-zinc-50 text-zinc-500",
  }[tone];

  return (
    <span className={`grid shrink-0 place-items-center rounded-full ${toneClass} ${small ? "h-8 w-8" : "h-10 w-10"}`}>
      <DashboardIcon name={icon} className={small ? "h-4 w-4" : "h-5 w-5"} />
    </span>
  );
}

function DashboardIcon({ name, className = "" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, string> = {
    points: "M12 3v18m6-15H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6",
    orders: "M6 7.5 12 4l6 3.5v9L12 20l-6-3.5v-9Zm0 0 6 3.5m6-3.5L12 11m0 0v9",
    history: "M3 12a9 9 0 1 0 3-6.7M3 5v5h5m4-3v5l3 2",
    support: "M5 12a7 7 0 0 1 14 0v3a3 3 0 0 1-3 3h-2l-2 3-2-3H8a3 3 0 0 1-3-3v-3Z",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2",
    box: "M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Zm0 0 8 4.5m8-4.5L12 12m0 0v9",
    truck: "M3 7h10v8H3V7Zm10 3h4l3 3v2h-7v-5ZM6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
    check: "M20 6 9 17l-5-5",
    x: "m6 6 12 12M18 6 6 18",
    bag: "M6 8h12l-1 12H7L6 8Zm3 0a3 3 0 0 1 6 0",
    map: "M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Zm0 0V3m6 18V6",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}

function getOrderCounts(orders: CustomerOrderSummary[]) {
  return {
    toConfirm: countStatuses(orders, ["pending_confirmation", "waiting_for_deposit", "deposit_paid"]),
    processing: countStatuses(orders, ["sourcing_items", "preparing", "confirmed"]),
    toReceive: countStatuses(orders, ["ready_for_pickup", "shipped", "out_for_delivery", "delivered"]),
    completed: countStatuses(orders, ["completed"]),
    cancelled: countStatuses(orders, ["cancelled", "unavailable_refund", "voided"]),
  };
}

function countStatuses(orders: CustomerOrderSummary[], statuses: string[]) {
  return orders.filter((order) => statuses.includes(order.orderStatus)).length;
}

function formatStat(value: number | null | undefined) {
  return value === null || value === undefined ? "-" : value.toLocaleString("en-US");
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
