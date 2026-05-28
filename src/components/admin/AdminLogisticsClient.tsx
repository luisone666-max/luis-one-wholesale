"use client";

import Link from "next/link";
import { AdminPageTitle, StatusPill } from "@/components/admin/AdminUi";
import type { AdminLogisticsReadiness } from "@/lib/admin-logistics-readiness";

function StatCard({ label, value, tone = "neutral" }: { label: string; value: number | string; tone?: "green" | "orange" | "neutral" }) {
  const toneClass = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    neutral: "border-zinc-200 bg-white text-zinc-800",
  }[tone];

  return (
    <div className={`rounded-md border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function ChecklistItem({ done, title, body }: { done: boolean; title: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black ${done ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
        {done ? "OK" : "!"}
      </span>
      <div>
        <p className="font-black text-zinc-950">{title}</p>
        <p className="mt-1 text-sm font-bold leading-6 text-zinc-500">{body}</p>
      </div>
    </div>
  );
}

export function AdminLogisticsClient({ readiness }: { readiness: AdminLogisticsReadiness }) {
  const { jntStatus, productStats, shipmentStats } = readiness;
  const productPackageReady =
    productStats.activeProducts > 0 &&
    productStats.productsMissingWeight === 0 &&
    productStats.productsMissingDimensions === 0 &&
    productStats.variantsMissingWeight === 0 &&
    productStats.variantsMissingDimensions === 0;

  return (
    <>
      <AdminPageTitle
        titleKey="settings"
        caption="Logistics readiness for COD, local waybills, customer order printouts, and future J&T live booking."
      />

      {readiness.errors.length ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-black leading-6 text-red-700">
          {readiness.errors.join(" / ")}
        </div>
      ) : null}

      <section className="mb-5 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">J&T API</p>
            <h1 className="mt-1 text-2xl font-black text-zinc-950">COD automation status</h1>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-zinc-500">
              Local printing and shipment drafts are available now. Live J&T booking should stay off until J&T provides the official API account, secret, sender details, and confirms the production endpoint.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={jntStatus.configured ? "green" : "orange"}>{jntStatus.configured ? "Config ready" : "Missing config"}</StatusPill>
            <StatusPill tone={jntStatus.liveBookingEnabled ? "green" : "neutral"}>
              {jntStatus.liveBookingEnabled ? "Live booking on" : "Live booking off"}
            </StatusPill>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <ChecklistItem
            done={jntStatus.configured}
            title="Required J&T credentials"
            body={jntStatus.missingRequired.length ? `Missing: ${jntStatus.missingRequired.join(", ")}` : "All required API credentials are present."}
          />
          <ChecklistItem
            done={jntStatus.missingRecommended.length === 0}
            title="Sender and endpoint details"
            body={jntStatus.missingRecommended.length ? `Missing: ${jntStatus.missingRecommended.join(", ")}` : "Sender and endpoint details are present."}
          />
          <ChecklistItem
            done={jntStatus.liveBookingEnabled}
            title="Live booking switch"
            body={jntStatus.liveBookingEnabled ? "The system can send booking requests to J&T." : "Keep this off until J&T confirms production access."}
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">Product Logistics</p>
              <h2 className="mt-1 text-xl font-black text-zinc-950">Package data readiness</h2>
            </div>
            <StatusPill tone={productPackageReady ? "green" : "orange"}>{productPackageReady ? "Ready" : "Needs data"}</StatusPill>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatCard label="Active products" value={productStats.activeProducts} />
            <StatCard label="Active variants" value={productStats.activeVariants} />
            <StatCard label="Products missing weight" value={productStats.productsMissingWeight} tone={productStats.productsMissingWeight ? "orange" : "green"} />
            <StatCard label="Products missing dimensions" value={productStats.productsMissingDimensions} tone={productStats.productsMissingDimensions ? "orange" : "green"} />
            <StatCard label="Variants missing weight" value={productStats.variantsMissingWeight} tone={productStats.variantsMissingWeight ? "orange" : "green"} />
            <StatCard label="Variants missing dimensions" value={productStats.variantsMissingDimensions} tone={productStats.variantsMissingDimensions ? "orange" : "green"} />
            <StatCard label="COD disabled products" value={productStats.codDisabledProducts} />
            <StatCard label="Restricted products" value={productStats.restrictedProducts} />
          </div>
          <Link href="/admin/products" className="mt-4 inline-flex rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white">
            Edit product logistics
          </Link>
        </section>

        <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">Shipment Desk</p>
              <h2 className="mt-1 text-xl font-black text-zinc-950">Order fulfillment queue</h2>
            </div>
            <Link href="/admin/orders" className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-black text-orange-700">
              Open orders
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatCard label="Shipment records" value={shipmentStats.total} />
            <StatCard label="Orders needing draft" value={shipmentStats.ordersNeedingShipmentDraft} tone={shipmentStats.ordersNeedingShipmentDraft ? "orange" : "green"} />
            <StatCard label="Draft" value={shipmentStats.draft} />
            <StatCard label="Ready to book" value={shipmentStats.readyToBook} />
            <StatCard label="Booked" value={shipmentStats.booked} />
            <StatCard label="In transit" value={shipmentStats.inTransit} />
            <StatCard label="Delivered" value={shipmentStats.delivered} tone="green" />
            <StatCard label="Failed / cancelled" value={shipmentStats.failedOrCancelled} tone={shipmentStats.failedOrCancelled ? "orange" : "neutral"} />
            <StatCard label="COD pending collection" value={shipmentStats.pendingCodCollection} />
          </div>
        </section>
      </div>
    </>
  );
}
