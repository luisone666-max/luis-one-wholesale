"use client";

import { AdminShell, useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { adminCustomers } from "@/lib/admin-mock-data";

function CustomersContent() {
  const { t } = useAdminI18n();

  return (
    <>
      <AdminPageTitle titleKey="customers" />
      <TableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t("name")}</th>
                <th className="px-4 py-3">{t("phone")}</th>
                <th className="px-4 py-3">{t("facebookMessenger")}</th>
                <th className="px-4 py-3">{t("location")}</th>
                <th className="px-4 py-3">{t("businessType")}</th>
                <th className="px-4 py-3">{t("orderCount")}</th>
                <th className="px-4 py-3">{t("totalSpend")}</th>
                <th className="px-4 py-3">{t("status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {adminCustomers.map((customer) => (
                <tr key={customer.phone}>
                  <td className="px-4 py-4 font-black text-zinc-950">{customer.name}</td>
                  <td className="px-4 py-4 text-zinc-600">{customer.phone}</td>
                  <td className="px-4 py-4 text-zinc-600">{customer.social}</td>
                  <td className="px-4 py-4 text-zinc-600">{customer.location}</td>
                  <td className="px-4 py-4 text-zinc-600">{customer.businessType}</td>
                  <td className="px-4 py-4 font-bold text-zinc-700">{customer.orderCount}</td>
                  <td className="px-4 py-4 font-black text-orange-700">{customer.totalSpend}</td>
                  <td className="px-4 py-4"><StatusPill tone="green">{customer.status}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>
    </>
  );
}

export default function AdminCustomersPage() {
  return (
    <AdminShell>
      <CustomersContent />
    </AdminShell>
  );
}
