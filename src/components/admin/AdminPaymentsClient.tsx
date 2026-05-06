"use client";

import { useMemo, useState } from "react";
import { AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import type { AdminPaymentListRecord } from "@/lib/admin-payments-data";
import { formatPhp } from "@/lib/wholesale-pricing";

const copy = {
  en: {
    caption: "Real payment records from website orders and offline cashier confirmations.",
    search: "Search order no, sale no, customer, reference, or cashier",
    source: "Source",
    documentNo: "Order / Sale No",
    customer: "Customer",
    receivedBy: "Received By",
    online: "Online Order",
    offline: "Offline POS",
    noRows: "No payment records yet.",
  },
  zh: {
    caption: "真实付款记录，包含网站订单付款记录和线下收银确认。",
    search: "搜索订单号、销售单号、客户、参考号或收银员",
    source: "来源",
    documentNo: "订单 / 销售单号",
    customer: "客户",
    receivedBy: "收款人",
    online: "线上订单",
    offline: "线下 POS",
    noRows: "暂无付款记录。",
  },
};

export function AdminPaymentsClient({ initialPayments, initialError }: { initialPayments: AdminPaymentListRecord[]; initialError?: string }) {
  const { t, language } = useAdminI18n();
  const text = copy[language];
  const [search, setSearch] = useState("");
  const visiblePayments = useMemo(() => {
    const needle = search.trim().toLowerCase();

    if (!needle) {
      return initialPayments;
    }

    return initialPayments.filter((payment) =>
      [
        payment.source,
        payment.documentNo,
        payment.customerName,
        payment.method,
        payment.referenceNo,
        payment.status,
        payment.receivedBy,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [initialPayments, search]);

  return (
    <>
      <AdminPageTitle titleKey="manualPayments" caption={text.caption} />
      {initialError ? <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-700">{initialError}</div> : null}

      <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={text.search}
          className="h-11 w-full rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
        />
      </div>

      <TableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{text.source}</th>
                <th className="px-4 py-3">{text.documentNo}</th>
                <th className="px-4 py-3">{text.customer}</th>
                <th className="px-4 py-3">{t("paymentMethod")}</th>
                <th className="px-4 py-3">{t("amount")}</th>
                <th className="px-4 py-3">{t("referenceNo")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{text.receivedBy}</th>
                <th className="px-4 py-3">{t("date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visiblePayments.map((record) => (
                <tr key={`${record.source}-${record.id}`}>
                  <td className="px-4 py-4">
                    <StatusPill tone={record.source === "offline_pos" ? "green" : "orange"}>
                      {record.source === "offline_pos" ? text.offline : text.online}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4 font-black text-zinc-950">{record.documentNo}</td>
                  <td className="px-4 py-4 text-zinc-600">{record.customerName}</td>
                  <td className="px-4 py-4 text-zinc-600">{record.method}</td>
                  <td className="px-4 py-4 font-black text-orange-700">{formatPhp(record.amount)}</td>
                  <td className="px-4 py-4 text-zinc-600">{record.referenceNo}</td>
                  <td className="px-4 py-4"><StatusPill tone="green">{record.status}</StatusPill></td>
                  <td className="px-4 py-4 text-zinc-600">{record.receivedBy}</td>
                  <td className="px-4 py-4 text-zinc-600">{record.date}</td>
                </tr>
              ))}
              {!visiblePayments.length ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm font-bold text-zinc-500" colSpan={9}>
                    {text.noRows}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TableShell>
    </>
  );
}

