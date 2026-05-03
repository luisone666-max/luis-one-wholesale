"use client";

import { AdminShell, useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPageTitle, Pager, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { adminOrders } from "@/lib/admin-mock-data";

function OrdersContent() {
  const { t } = useAdminI18n();

  return (
    <>
      <AdminPageTitle titleKey="orders" />
      <TableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t("orderNo")}</th>
                <th className="px-4 py-3">{t("customers")}</th>
                <th className="px-4 py-3">{t("phone")}</th>
                <th className="px-4 py-3">{t("productTotal")}</th>
                <th className="px-4 py-3">{t("orderStatus")}</th>
                <th className="px-4 py-3">{t("paymentStatus")}</th>
                <th className="px-4 py-3">{t("receivingMethod")}</th>
                <th className="px-4 py-3">{t("shippingFeePayment")}</th>
                <th className="px-4 py-3">{t("date")}</th>
                <th className="px-4 py-3">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {adminOrders.map((order) => (
                <tr key={order.orderNo}>
                  <td className="px-4 py-4 font-black text-zinc-950">{order.orderNo}</td>
                  <td className="px-4 py-4 text-zinc-700">{order.customer}</td>
                  <td className="px-4 py-4 text-zinc-600">{order.phone}</td>
                  <td className="px-4 py-4 font-black text-orange-700">{order.productTotal}</td>
                  <td className="px-4 py-4"><StatusPill tone="orange">{t(order.orderStatusKey)}</StatusPill></td>
                  <td className="px-4 py-4"><StatusPill tone="green">{t(order.paymentStatusKey)}</StatusPill></td>
                  <td className="px-4 py-4 text-zinc-600">{order.receivingMethod}</td>
                  <td className="px-4 py-4 text-zinc-600">{order.shippingFeePayment}</td>
                  <td className="px-4 py-4 text-zinc-600">{order.date}</td>
                  <td className="px-4 py-4">
                    <button type="button" className="rounded-md border border-orange-200 px-3 py-2 text-xs font-black text-orange-700">
                      {t("edit")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager />
      </TableShell>
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminShell>
      <OrdersContent />
    </AdminShell>
  );
}
