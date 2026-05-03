"use client";

import Link from "next/link";
import { AdminShell, useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPageTitle } from "@/components/admin/AdminUi";
import { dashboardStats, adminOrders } from "@/lib/admin-mock-data";

function DashboardContent() {
  const { t } = useAdminI18n();

  return (
    <>
      <AdminPageTitle titleKey="dashboard" />
      <div className="mb-5 flex flex-wrap gap-3 rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <Link href="/admin/categories" className="rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white">
          {t("addMainCategory")}
        </Link>
        <Link href="/admin/products" className="rounded-md border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
          {t("addProduct")}
        </Link>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <div key={stat.key} className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-zinc-500">{t(stat.key)}</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-zinc-950">{stat.value}</p>
            <div className="mt-4 h-1.5 rounded-full bg-orange-100">
              <div className="h-1.5 w-2/3 rounded-full bg-[#f65f18]" />
            </div>
          </div>
        ))}
      </section>
      <section className="mt-6 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-zinc-950">{t("orders")}</h2>
          <span className="rounded bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">{t("pendingOrders")}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t("orderNo")}</th>
                <th className="px-4 py-3">{t("customers")}</th>
                <th className="px-4 py-3">{t("orderStatus")}</th>
                <th className="px-4 py-3">{t("productTotal")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {adminOrders.slice(0, 4).map((order) => (
                <tr key={order.orderNo}>
                  <td className="px-4 py-4 font-black text-zinc-900">{order.orderNo}</td>
                  <td className="px-4 py-4 text-zinc-600">{order.customer}</td>
                  <td className="px-4 py-4 text-zinc-600">{t(order.orderStatusKey)}</td>
                  <td className="px-4 py-4 font-black text-orange-700">{order.productTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <DashboardContent />
    </AdminShell>
  );
}
