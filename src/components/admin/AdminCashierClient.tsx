"use client";

import { useMemo, useState } from "react";
import { AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPosSalePrintTemplate } from "@/components/admin/AdminPosSalePrintTemplate";
import type { PosSaleRecord } from "@/lib/pos-data";
import { formatLoyaltyPoints } from "@/lib/loyalty-points";
import { formatPhp } from "@/lib/wholesale-pricing";

type LoyaltyResult = {
  ok: boolean;
  points: number;
  awarded: boolean;
  message?: string;
};

const copy = {
  en: {
    caption: "Offline cashier only. Review sales slips from Sales Desk, check the payment method and amount, then confirm payment.",
    refresh: "Refresh Waiting Sales",
    confirmPayment: "Confirm Payment Received",
    saleNo: "Sale No",
    salesperson: "Salesperson",
    customer: "Customer",
    paymentMethod: "Payment Method",
    amount: "Amount to Collect",
    referenceNo: "GCash / Bank Reference No",
    notes: "Cashier Notes",
    items: "Items",
    waiting: "Waiting cashier",
    noSales: "No offline sales waiting for cashier.",
    confirmed: "Payment confirmed.",
    flowTitle: "Cashier checklist",
    flowStep1: "Check sale slip",
    flowStep2: "Confirm cash / GCash / bank transfer",
    flowStep3: "Click confirm payment",
    onlineOrdersLink: "Website customer orders are separate in Online Orders.",
    cashDrawerUpdated: "Cash drawer totals are updated automatically.",
    transferReferenceHint: "GCash and bank transfer payments require a reference number.",
    printA6: "Print A6",
    waitingTotal: "Waiting Total",
    cashWaiting: "Cash Waiting",
    transferWaiting: "GCash / Bank Waiting",
    cashierAction: "Cashier Action",
    cashConfirmHint: "Count the cash, then confirm payment.",
    transferConfirmHint: "Check the transfer receipt and enter the reference number before confirming.",
  },
  zh: {
    caption: "这里只做线下收银确认。收银员核对销售单、收款方式和金额后，再确认收款。",
    refresh: "刷新待收款销售单",
    confirmPayment: "确认已收款",
    saleNo: "销售单号",
    salesperson: "销售员",
    customer: "客户",
    paymentMethod: "收款方式",
    amount: "应收金额",
    referenceNo: "GCash / 银行参考号",
    notes: "收银备注",
    items: "商品明细",
    waiting: "等待收银",
    noSales: "暂无等待收银的线下销售单。",
    confirmed: "已确认收款。",
    flowTitle: "收银员确认步骤",
    flowStep1: "核对销售单",
    flowStep2: "确认现金 / GCash / 银行转账",
    flowStep3: "点击确认收款",
    onlineOrdersLink: "网站客户订单在“线上订单”里处理，这里只处理线下门店销售。",
    cashDrawerUpdated: "钱箱统计会自动更新。",
    transferReferenceHint: "GCash 和银行转账必须填写参考号。",
    printA6: "打印 A6",
    waitingTotal: "待收款总额",
    cashWaiting: "待收现金",
    transferWaiting: "待收 GCash / 银行",
    cashierAction: "收银操作",
    cashConfirmHint: "现金单：点清现金后再确认收款。",
    transferConfirmHint: "转账单：核对到账记录，并填写参考号后再确认。",
  },
};

function paymentMethodLabel(method: string, language: "en" | "zh") {
  const labels = {
    en: {
      cash: "Cash",
      gcash: "GCash",
      bank_transfer: "Bank Transfer",
      other: "Other",
    },
    zh: {
      cash: "现金",
      gcash: "GCash",
      bank_transfer: "银行转账",
      other: "其他",
    },
  };

  return labels[language][method as keyof typeof labels.en] ?? method;
}

function inputClass() {
  return "h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-900 outline-none focus:border-orange-500";
}

function isTransferPayment(method: string) {
  return method === "gcash" || method === "bank_transfer";
}

function SummaryCard({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "orange" | "green" | "neutral" }) {
  const toneClass = {
    green: "text-emerald-700",
    neutral: "text-zinc-950",
    orange: "text-[#f65f18]",
  }[tone];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">{label}</p>
      <p className={`mt-2 text-2xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

export function AdminCashierClient({ initialSales, initialError }: { initialSales: PosSaleRecord[]; initialError?: string }) {
  const { language } = useAdminI18n();
  const t = language === "zh" ? copy.zh : copy.en;
  const [sales, setSales] = useState(initialSales);
  const [message, setMessage] = useState(initialError ?? "");
  const [referenceNoBySale, setReferenceNoBySale] = useState<Record<string, string>>({});
  const [notesBySale, setNotesBySale] = useState<Record<string, string>>({});
  const [printSale, setPrintSale] = useState<PosSaleRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const waitingSummary = useMemo(
    () =>
      sales.reduce(
        (summary, sale) => {
          summary.total += sale.totalAmount;

          if (sale.paymentMethod === "cash") {
            summary.cash += sale.totalAmount;
          } else if (isTransferPayment(sale.paymentMethod)) {
            summary.transfer += sale.totalAmount;
          } else {
            summary.other += sale.totalAmount;
          }

          return summary;
        },
        { total: 0, cash: 0, transfer: 0, other: 0 },
      ),
    [sales],
  );

  async function refresh() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/pos/sales?status=waiting_cashier");
      const result = (await response.json()) as { ok?: boolean; message?: string; sales?: PosSaleRecord[] };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "Unable to load sales.");
        return;
      }

      setSales(result.sales ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function confirm(sale: PosSaleRecord) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/pos/sales/${sale.id}/confirm-payment`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: sale.totalAmount,
          referenceNo: referenceNoBySale[sale.id] ?? "",
          notes: notesBySale[sale.id] ?? "",
        }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; loyalty?: LoyaltyResult };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "Payment confirmation failed.");
        return;
      }

      setSales((current) => current.filter((item) => item.id !== sale.id));
      const loyaltyMessage = result.loyalty?.awarded
        ? ` ${formatLoyaltyPoints(result.loyalty.points)} awarded to member.`
        : result.loyalty && !result.loyalty.ok
          ? ` Points need manual check: ${result.loyalty.message ?? "unknown error"}`
          : "";
      setMessage(`${t.confirmed}${loyaltyMessage} ${t.cashDrawerUpdated}`);
    } finally {
      setLoading(false);
    }
  }

  function printPosSale(sale: PosSaleRecord) {
    setPrintSale(sale);
    window.setTimeout(() => window.print(), 50);
  }

  return (
    <div className="space-y-5">
      <AdminPageTitle titleKey="cashierCenter" caption={t.caption} />
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">{t.flowTitle}</p>
            <p className="mt-2 text-sm font-bold text-emerald-900">{t.onlineOrdersLink}</p>
            <p className="mt-1 text-xs font-bold text-emerald-800">{t.transferReferenceHint}</p>
          </div>
          <div className="grid gap-2 text-sm font-black text-emerald-900 sm:grid-cols-3">
            <span className="rounded-md bg-white px-3 py-2 ring-1 ring-emerald-100">{t.flowStep1}</span>
            <span className="rounded-md bg-white px-3 py-2 ring-1 ring-emerald-100">{t.flowStep2}</span>
            <span className="rounded-md bg-white px-3 py-2 ring-1 ring-emerald-100">{t.flowStep3}</span>
          </div>
        </div>
      </section>
      {message ? <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-800">{message}</div> : null}

      <section className="grid gap-3 md:grid-cols-4">
        <SummaryCard label={t.waitingTotal} value={formatPhp(waitingSummary.total)} tone="orange" />
        <SummaryCard label={t.cashWaiting} value={formatPhp(waitingSummary.cash)} tone="green" />
        <SummaryCard label={t.transferWaiting} value={formatPhp(waitingSummary.transfer)} />
        <SummaryCard label={t.items} value={String(sales.length)} />
      </section>

      <div className="flex justify-end">
        <button type="button" disabled={loading} onClick={() => void refresh()} className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700 disabled:opacity-60">
          {t.refresh}
        </button>
      </div>

      <div className="grid gap-4 print:hidden">
        {sales.length ? (
          sales.map((sale) => (
            <section key={sale.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-zinc-950">{sale.saleNo}</h2>
                    <StatusPill tone="orange">{t.waiting}</StatusPill>
                  </div>
                  <p className="mt-2 text-sm font-bold text-zinc-500">
                    {t.salesperson}: {sale.salespersonName || sale.salespersonEmployeeNo} | {t.customer}: {sale.customerName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">{t.amount}</p>
                  <p className="text-3xl font-black text-[#f65f18]">{formatPhp(sale.totalAmount)}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-500">
                    {t.paymentMethod}: {paymentMethodLabel(sale.paymentMethod, language)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <TableShell>
                  <div className="overflow-x-auto pb-2">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                        <tr>
                          <th className="px-4 py-3">{t.items}</th>
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3">Qty</th>
                          <th className="px-4 py-3">Unit</th>
                          <th className="px-4 py-3">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {sale.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 font-bold text-zinc-900">{item.name}</td>
                            <td className="px-4 py-3 text-zinc-600">{item.sku}</td>
                            <td className="px-4 py-3 text-zinc-600">{item.quantity}</td>
                            <td className="px-4 py-3 text-zinc-600">{formatPhp(item.unitPrice)}</td>
                            <td className="px-4 py-3 font-black text-zinc-900">{formatPhp(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TableShell>
              </div>

              <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">{t.cashierAction}</p>
                <p className="mt-1 text-sm font-bold text-zinc-600">
                  {isTransferPayment(sale.paymentMethod) ? t.transferConfirmHint : t.cashConfirmHint}
                </p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                <input
                  className={inputClass()}
                  placeholder={isTransferPayment(sale.paymentMethod) ? t.referenceNo : `${t.referenceNo} (${paymentMethodLabel(sale.paymentMethod, language)})`}
                  value={referenceNoBySale[sale.id] ?? ""}
                  disabled={!isTransferPayment(sale.paymentMethod)}
                  onChange={(event) => setReferenceNoBySale((current) => ({ ...current, [sale.id]: event.target.value }))}
                />
                <input className={inputClass()} placeholder={t.notes} value={notesBySale[sale.id] ?? ""} onChange={(event) => setNotesBySale((current) => ({ ...current, [sale.id]: event.target.value }))} />
                <button type="button" disabled={loading} onClick={() => printPosSale(sale)} className="rounded-md border border-zinc-200 px-5 py-2 text-sm font-black text-zinc-700 disabled:opacity-60">
                  {t.printA6}
                </button>
                <button type="button" disabled={loading} onClick={() => void confirm(sale)} className="rounded-md bg-[#f65f18] px-5 py-2 text-sm font-black text-white disabled:opacity-60">
                  {t.confirmPayment}
                </button>
              </div>
            </section>
          ))
        ) : (
          <section className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm font-bold text-zinc-500 shadow-sm">{t.noSales}</section>
        )}
      </div>
      <AdminPosSalePrintTemplate sale={printSale} />
    </div>
  );
}
