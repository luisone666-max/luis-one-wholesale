"use client";

import { AdminShell, useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { paymentRecords } from "@/lib/admin-mock-data";

function PaymentsContent() {
  const { t } = useAdminI18n();

  return (
    <>
      <AdminPageTitle titleKey="manualPayments" />
      <TableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t("orderNo")}</th>
                <th className="px-4 py-3">{t("paymentMethod")}</th>
                <th className="px-4 py-3">{t("amount")}</th>
                <th className="px-4 py-3">{t("referenceNo")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{t("date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paymentRecords.map((record) => (
                <tr key={record.referenceNo}>
                  <td className="px-4 py-4 font-black text-zinc-950">{record.orderNo}</td>
                  <td className="px-4 py-4 text-zinc-600">{record.method}</td>
                  <td className="px-4 py-4 font-black text-orange-700">{record.amount}</td>
                  <td className="px-4 py-4 text-zinc-600">{record.referenceNo}</td>
                  <td className="px-4 py-4"><StatusPill tone="green">{record.status}</StatusPill></td>
                  <td className="px-4 py-4 text-zinc-600">{record.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>
    </>
  );
}

export default function AdminPaymentsPage() {
  return (
    <AdminShell>
      <PaymentsContent />
    </AdminShell>
  );
}
