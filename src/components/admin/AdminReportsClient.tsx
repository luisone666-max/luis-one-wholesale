"use client";

import { useMemo, useState } from "react";
import { AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import type { BusinessReportOverview, EmployeeSalesReportRow } from "@/lib/employee-sales-report-data";
import { formatPhp } from "@/lib/wholesale-pricing";

const copy = {
  en: {
    caption: "Owner report for online orders, offline POS sales, cashier-confirmed payments, payment methods, and employee sales.",
    todayOverview: "Today Overview",
    monthOverview: "This Month Overview",
    paymentBreakdown: "Payment Breakdown",
    employeeReport: "Employee Monthly Sales",
    salesTotal: "Sales Total",
    paidTotal: "Collected / Paid",
    onlineSubmitted: "Online Orders Submitted",
    offlineSubmitted: "Offline POS Slips",
    onlinePaid: "Online Confirmed Paid",
    offlinePaid: "Offline Cashier Paid",
    cash: "Cash",
    gcash: "GCash",
    bankTransfer: "Bank Transfer",
    otherPayment: "Other",
    waitingCashier: "Waiting Cashier",
    pendingOnline: "Pending Online Orders",
    month: "Month",
    allMonths: "All Months",
    salesperson: "Salesperson",
    orderCount: "Orders / Slips",
    productTotal: "Sales Total",
    paidOrders: "Paid Count",
    noRows: "No sales records yet.",
    selectedTotal: "Selected Sales Total",
    selectedPaidTotal: "Selected Paid Total",
    selectedOrders: "Selected Orders",
    selectedStaff: "Salespeople",
    note: "Sales Total counts valid non-cancelled online orders and offline POS slips. Collected / Paid counts confirmed online payments and cashier-confirmed offline POS payments.",
  },
  zh: {
    caption: "老板报表：线上订单、线下 POS、收银确认、收款方式、员工销售额统一查看。",
    todayOverview: "今日总览",
    monthOverview: "本月总览",
    paymentBreakdown: "收款方式",
    employeeReport: "员工月销售",
    salesTotal: "销售总额",
    paidTotal: "已收款金额",
    onlineSubmitted: "线上提交订单",
    offlineSubmitted: "线下开单金额",
    onlinePaid: "线上已确认收款",
    offlinePaid: "线下收银已收款",
    cash: "现金",
    gcash: "GCash",
    bankTransfer: "银行转账",
    otherPayment: "其他收款",
    waitingCashier: "待收银",
    pendingOnline: "待确认线上订单",
    month: "月份",
    allMonths: "全部月份",
    salesperson: "销售员",
    orderCount: "订单 / 销售单",
    productTotal: "销售总额",
    paidOrders: "已收款单数",
    noRows: "暂无销售记录。",
    selectedTotal: "所选销售总额",
    selectedPaidTotal: "所选已收款金额",
    selectedOrders: "所选单数",
    selectedStaff: "销售人数",
    note: "销售总额统计未取消的线上订单和线下销售单；已收款金额统计线上已确认付款和线下收银员已确认收款。",
  },
};

function SummaryCard({ label, value, tone = "neutral", detail }: { label: string; value: string; tone?: "orange" | "green" | "neutral"; detail?: string }) {
  const toneClass = {
    green: "text-emerald-700",
    neutral: "text-zinc-950",
    orange: "text-[#f65f18]",
  }[tone];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">{label}</p>
      <p className={`mt-2 text-2xl font-black ${toneClass}`}>{value}</p>
      {detail ? <p className="mt-1 text-xs font-bold text-zinc-500">{detail}</p> : null}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-lg font-black text-zinc-950">{title}</h2>;
}

export function AdminReportsClient({
  rows,
  monthOptions,
  overview,
  initialError,
}: {
  rows: EmployeeSalesReportRow[];
  monthOptions: string[];
  overview: BusinessReportOverview;
  initialError?: string;
}) {
  const { language } = useAdminI18n();
  const t = language === "zh" ? copy.zh : copy.en;
  const [month, setMonth] = useState(monthOptions[0] ?? "all");
  const visibleRows = useMemo(() => rows.filter((row) => month === "all" || row.month === month), [month, rows]);
  const summary = useMemo(
    () => ({
      orderCount: visibleRows.reduce((total, row) => total + row.orderCount, 0),
      productTotal: visibleRows.reduce((total, row) => total + row.productTotal, 0),
      paidTotal: visibleRows.reduce((total, row) => total + row.paidTotal, 0),
      staffCount: new Set(visibleRows.map((row) => row.salesAdminUserId || "unassigned")).size,
    }),
    [visibleRows],
  );

  return (
    <div className="space-y-6">
      <AdminPageTitle titleKey="reports" caption={t.caption} />

      {initialError ? <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-700">{initialError}</div> : null}

      <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 text-sm font-bold leading-6 text-orange-800">{t.note}</div>

      <section className="space-y-3">
        <SectionTitle title={t.todayOverview} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label={t.salesTotal} value={formatPhp(overview.todaySalesTotal)} tone="orange" />
          <SummaryCard label={t.paidTotal} value={formatPhp(overview.todayPaidTotal)} tone="green" />
          <SummaryCard label={t.onlineSubmitted} value={formatPhp(overview.todayOnlineSubmittedTotal)} />
          <SummaryCard label={t.offlineSubmitted} value={formatPhp(overview.todayOfflineSubmittedTotal)} />
          <SummaryCard label={t.onlinePaid} value={formatPhp(overview.todayOnlinePaidTotal)} />
          <SummaryCard label={t.offlinePaid} value={formatPhp(overview.todayOfflinePaidTotal)} />
          <SummaryCard label={t.waitingCashier} value={formatPhp(overview.todayWaitingCashierTotal)} detail={`${overview.todayWaitingCashierCount}`} />
          <SummaryCard label={t.pendingOnline} value={formatPhp(overview.todayPendingOnlineTotal)} detail={`${overview.todayPendingOnlineCount}`} />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle title={t.monthOverview} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label={t.salesTotal} value={formatPhp(overview.monthSalesTotal)} tone="orange" />
          <SummaryCard label={t.paidTotal} value={formatPhp(overview.monthPaidTotal)} tone="green" />
          <SummaryCard label={t.onlineSubmitted} value={formatPhp(overview.monthOnlineSubmittedTotal)} />
          <SummaryCard label={t.offlineSubmitted} value={formatPhp(overview.monthOfflineSubmittedTotal)} />
          <SummaryCard label={t.onlinePaid} value={formatPhp(overview.monthOnlinePaidTotal)} />
          <SummaryCard label={t.offlinePaid} value={formatPhp(overview.monthOfflinePaidTotal)} />
          <SummaryCard label={t.waitingCashier} value={formatPhp(overview.monthWaitingCashierTotal)} detail={`${overview.monthWaitingCashierCount}`} />
          <SummaryCard label={t.pendingOnline} value={formatPhp(overview.monthPendingOnlineTotal)} detail={`${overview.monthPendingOnlineCount}`} />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle title={t.paymentBreakdown} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label={`${t.cash} / ${t.todayOverview}`} value={formatPhp(overview.todayCashTotal)} tone="green" />
          <SummaryCard label={`${t.gcash} / ${t.todayOverview}`} value={formatPhp(overview.todayGcashTotal)} />
          <SummaryCard label={`${t.bankTransfer} / ${t.todayOverview}`} value={formatPhp(overview.todayBankTransferTotal)} />
          <SummaryCard label={`${t.otherPayment} / ${t.todayOverview}`} value={formatPhp(overview.todayOtherPaymentTotal)} />
          <SummaryCard label={`${t.cash} / ${t.monthOverview}`} value={formatPhp(overview.monthCashTotal)} tone="green" />
          <SummaryCard label={`${t.gcash} / ${t.monthOverview}`} value={formatPhp(overview.monthGcashTotal)} />
          <SummaryCard label={`${t.bankTransfer} / ${t.monthOverview}`} value={formatPhp(overview.monthBankTransferTotal)} />
          <SummaryCard label={`${t.otherPayment} / ${t.monthOverview}`} value={formatPhp(overview.monthOtherPaymentTotal)} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <SectionTitle title={t.employeeReport} />
            <p className="mt-1 text-sm font-bold text-zinc-500">{t.selectedTotal}: {formatPhp(summary.productTotal)}</p>
          </div>
          <label className="block w-full max-w-xs">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.month}</span>
            <select value={month} onChange={(event) => setMonth(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-orange-500">
              <option value="all">{t.allMonths}</option>
              {monthOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <section className="grid gap-3 md:grid-cols-4">
          <SummaryCard label={t.selectedTotal} value={formatPhp(summary.productTotal)} />
          <SummaryCard label={t.selectedPaidTotal} value={formatPhp(summary.paidTotal)} />
          <SummaryCard label={t.selectedOrders} value={String(summary.orderCount)} />
          <SummaryCard label={t.selectedStaff} value={String(summary.staffCount)} />
        </section>

        <TableShell>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">{t.month}</th>
                  <th className="px-4 py-3">{t.salesperson}</th>
                  <th className="px-4 py-3">{t.orderCount}</th>
                  <th className="px-4 py-3">{t.productTotal}</th>
                  <th className="px-4 py-3">{t.paidOrders}</th>
                  <th className="px-4 py-3">{t.paidTotal}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {visibleRows.length ? (
                  visibleRows.map((row) => (
                    <tr key={`${row.month}-${row.salesAdminUserId || "unassigned"}`}>
                      <td className="px-4 py-4 font-black text-zinc-950">{row.month}</td>
                      <td className="px-4 py-4">
                        <StatusPill tone={row.salesAdminUserId ? "green" : "neutral"}>{row.salesName}</StatusPill>
                      </td>
                      <td className="px-4 py-4 font-bold text-zinc-700">{row.orderCount}</td>
                      <td className="px-4 py-4 font-black text-orange-700">{formatPhp(row.productTotal)}</td>
                      <td className="px-4 py-4 font-bold text-zinc-700">{row.paidOrderCount}</td>
                      <td className="px-4 py-4 font-black text-emerald-700">{formatPhp(row.paidTotal)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm font-bold text-zinc-500" colSpan={6}>
                      {t.noRows}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableShell>
      </section>
    </div>
  );
}
