"use client";

import { useEffect, useMemo, useState } from "react";
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

type CashDrawerConfirmSummary = {
  businessDate: string;
  cashSalesTotal: number;
  gcashSalesTotal: number;
  bankTransferSalesTotal: number;
  transferSalesTotal: number;
  expectedCash: number;
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
    referenceRequired: "Enter the GCash / bank reference number before confirming.",
    autoRefresh: "This page checks for new sales every 15 seconds.",
    saleReview: "Sale Review",
    productTotal: "Product Total",
    discount: "Discount",
    amountDue: "Amount Due",
    priceNotes: "Price / discount notes",
    saleNotes: "Sale notes",
    auditTrail: "Audit Trail",
    noAudit: "No audit records yet.",
    by: "By",
    reason: "Reason",
    statusChange: "Status Change",
    cashierQueueStatus: "Cashier Queue",
    waitingSlips: "Waiting Slips",
    nextToCollect: "Next to Collect",
    cashSlips: "Cash Slips",
    transferSlips: "Transfer Slips",
    noWaitingSlipsShort: "No waiting slips",
    cashControlHint: "Cash payments must match the physical cash drawer.",
    transferControlHint: "GCash / bank payments need a reference number before confirmation.",
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
    referenceRequired: "请先填写 GCash / 银行参考号，再确认收款。",
    autoRefresh: "本页面每 15 秒自动检查新的销售单。",
  },
};

const zhCopy = {
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
  referenceRequired: "请先填写 GCash / 银行参考号，再确认收款。",
  autoRefresh: "本页面每 15 秒自动检查新的销售单。",
  saleReview: "\u9500\u552e\u5355\u6838\u5bf9",
  productTotal: "\u5546\u54c1\u5c0f\u8ba1",
  discount: "\u6298\u6263",
  amountDue: "\u5e94\u6536\u91d1\u989d",
  priceNotes: "\u6539\u4ef7 / \u6298\u6263\u5907\u6ce8",
  saleNotes: "\u9500\u552e\u5907\u6ce8",
  auditTrail: "\u64cd\u4f5c\u8bb0\u5f55",
  noAudit: "\u6682\u65e0\u64cd\u4f5c\u8bb0\u5f55\u3002",
  by: "\u64cd\u4f5c\u4eba",
  reason: "\u539f\u56e0",
  statusChange: "\u72b6\u6001\u53d8\u5316",
  cashierQueueStatus: "\u6536\u94f6\u961f\u5217",
  waitingSlips: "\u5f85\u6536\u5355\u6570",
  nextToCollect: "\u4e0b\u4e00\u5f20\u5e94\u6536",
  cashSlips: "\u73b0\u91d1\u5355",
  transferSlips: "\u8f6c\u8d26\u5355",
  noWaitingSlipsShort: "\u6ca1\u6709\u5f85\u6536\u5355",
  cashControlHint: "\u73b0\u91d1\u5355\u8981\u548c\u5b9e\u9645\u94b1\u7bb1\u73b0\u91d1\u5bf9\u4e0a\u3002",
  transferControlHint: "GCash / \u94f6\u884c\u8f6c\u8d26\u786e\u8ba4\u524d\u5fc5\u987b\u586b\u53c2\u8003\u53f7\u3002",
} satisfies typeof copy.en;

const cashierActionText = {
  en: {
    returnToSales: "Return to Sales",
    returnReasonPrompt: "Reason for returning this sale to Sales Desk?",
    returned: "Sale returned to Sales Desk for correction.",
  },
  zh: {
    returnToSales: "\u9000\u56de\u9500\u552e\u4fee\u6539",
    returnReasonPrompt: "\u8bf7\u8f93\u5165\u9000\u56de\u9500\u552e\u4fee\u6539\u7684\u539f\u56e0\uff1a",
    returned: "\u5df2\u9000\u56de\u9500\u552e\u5f00\u5355\u9875\u9762\u4fee\u6539\u3002",
  },
};

function paymentMethodLabel(method: string, language: "en" | "zh") {
  const labels: Record<"en" | "zh", Record<string, string>> = {
    en: {
      cash: "Cash",
      gcash: "GCash",
      bank_transfer: "Bank Transfer",
      other: "Other",
    },
    zh: {
      cash: "\u73b0\u91d1",
      gcash: "GCash",
      bank_transfer: "\u94f6\u884c\u8f6c\u8d26",
      other: "\u5176\u4ed6",
    },
  };

  return labels[language][method] ?? method;
}

function inputClass() {
  return "h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-900 outline-none focus:border-orange-500";
}

function isTransferPayment(method: string) {
  return method === "gcash" || method === "bank_transfer";
}

function cashDrawerSummaryMessage(summary: CashDrawerConfirmSummary | undefined, language: "en" | "zh") {
  if (!summary) {
    return "";
  }

  const transferTotal = summary.gcashSalesTotal + summary.bankTransferSalesTotal;

  if (language === "zh") {
    return ` \u4eca\u65e5\u94b1\u7bb1\uff1a\u73b0\u91d1 ${formatPhp(summary.cashSalesTotal)}\uff0cGCash/\u94f6\u884c ${formatPhp(transferTotal)}\uff0c\u5e94\u6709\u73b0\u91d1 ${formatPhp(summary.expectedCash)}\u3002`;
  }

  return ` Today drawer: cash ${formatPhp(summary.cashSalesTotal)}, GCash/bank ${formatPhp(transferTotal)}, expected cash ${formatPhp(summary.expectedCash)}.`;
}

function shortDate(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function auditActionLabel(action: string, language: "en" | "zh") {
  const labels: Record<string, string> = {
    created: language === "zh" ? "\u521b\u5efa\u9500\u552e\u5355" : "Created",
    updated: language === "zh" ? "\u4fee\u6539\u9500\u552e\u5355" : "Updated",
    returned_to_sales: language === "zh" ? "\u9000\u56de\u9500\u552e\u4fee\u6539" : "Returned to Sales",
    cancelled: language === "zh" ? "\u53d6\u6d88\u9500\u552e\u5355" : "Cancelled",
    payment_confirmed: language === "zh" ? "\u6536\u94f6\u786e\u8ba4\u6536\u6b3e" : "Payment Confirmed",
    voided_paid_sale: language === "zh" ? "\u4f5c\u5e9f\u5df2\u6536\u6b3e" : "Voided Paid Sale",
  };

  return labels[action] ?? action.replace(/_/g, " ");
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
  const t = language === "zh" ? zhCopy : copy.en;
  const actionText = cashierActionText[language];
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
            summary.cashCount += 1;
          } else if (isTransferPayment(sale.paymentMethod)) {
            summary.transfer += sale.totalAmount;
            summary.transferCount += 1;
          } else {
            summary.other += sale.totalAmount;
            summary.otherCount += 1;
          }

          return summary;
        },
        { total: 0, cash: 0, transfer: 0, other: 0, cashCount: 0, transferCount: 0, otherCount: 0 },
    ),
    [sales],
  );
  const nextSale = sales[0];

  useEffect(() => {
    let active = true;

    const refreshQuietly = async () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      const response = await fetch("/api/admin/pos/sales?status=waiting_cashier");
      const result = (await response.json().catch(() => null)) as { ok?: boolean; sales?: PosSaleRecord[] } | null;

      if (active && response.ok && result?.ok) {
        setSales(result.sales ?? []);
      }
    };

    const timer = window.setInterval(() => {
      void refreshQuietly();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

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
    if (isTransferPayment(sale.paymentMethod) && !(referenceNoBySale[sale.id] ?? "").trim()) {
      setMessage(t.referenceRequired);
      return;
    }

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
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        loyalty?: LoyaltyResult;
        cashDrawer?: CashDrawerConfirmSummary;
      };

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
      setMessage(`${t.confirmed}${loyaltyMessage} ${t.cashDrawerUpdated}${cashDrawerSummaryMessage(result.cashDrawer, language)}`);
    } finally {
      setLoading(false);
    }
  }

  async function returnToSales(sale: PosSaleRecord) {
    const reason = window.prompt(actionText.returnReasonPrompt);

    if (!reason?.trim()) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/pos/sales/${sale.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "return_to_sales", reason }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "Unable to return sale to Sales Desk.");
        return;
      }

      setSales((current) => current.filter((item) => item.id !== sale.id));
      setMessage(actionText.returned);
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
            <p className="mt-1 text-xs font-bold text-emerald-700">{t.autoRefresh}</p>
          </div>
          <div className="grid gap-2 text-sm font-black text-emerald-900 sm:grid-cols-3">
            <span className="rounded-md bg-white px-3 py-2 ring-1 ring-emerald-100">{t.flowStep1}</span>
            <span className="rounded-md bg-white px-3 py-2 ring-1 ring-emerald-100">{t.flowStep2}</span>
            <span className="rounded-md bg-white px-3 py-2 ring-1 ring-emerald-100">{t.flowStep3}</span>
          </div>
        </div>
      </section>
      {message ? <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-800">{message}</div> : null}

      <section className="sticky top-2 z-20 rounded-lg border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur print:hidden">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-md bg-zinc-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">{t.cashierQueueStatus}</p>
              <p className="mt-1 text-sm font-black text-zinc-950">{sales.length ? t.waiting : t.noWaitingSlipsShort}</p>
            </div>
            <div className="rounded-md bg-orange-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-orange-500">{t.waitingSlips}</p>
              <p className="mt-1 text-lg font-black text-orange-700">{sales.length}</p>
            </div>
            <div className="rounded-md bg-zinc-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">{t.cashSlips}</p>
              <p className="mt-1 text-sm font-black text-zinc-950">
                {waitingSummary.cashCount} / {formatPhp(waitingSummary.cash)}
              </p>
            </div>
            <div className="rounded-md bg-zinc-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">{t.transferSlips}</p>
              <p className="mt-1 text-sm font-black text-zinc-950">
                {waitingSummary.transferCount} / {formatPhp(waitingSummary.transfer)}
              </p>
            </div>
            <div className="rounded-md bg-emerald-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600">{t.nextToCollect}</p>
              <p className="mt-1 text-lg font-black text-emerald-700">{nextSale ? formatPhp(nextSale.totalAmount) : "-"}</p>
            </div>
          </div>
          <button type="button" disabled={loading} onClick={() => void refresh()} className="h-12 rounded-md bg-zinc-950 px-5 text-sm font-black text-white disabled:opacity-50">
            {t.refresh}
          </button>
        </div>
        <div className="mt-3 grid gap-2 text-xs font-bold text-zinc-600 md:grid-cols-2">
          <p className="rounded-md bg-zinc-50 px-3 py-2">{t.cashControlHint}</p>
          <p className="rounded-md bg-zinc-50 px-3 py-2">{t.transferControlHint}</p>
        </div>
      </section>

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
          sales.map((sale) => {
            const transferReference = referenceNoBySale[sale.id] ?? "";
            const needsReference = isTransferPayment(sale.paymentMethod);
            const canConfirm = !needsReference || transferReference.trim().length > 0;

            return (
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

              <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">{t.saleReview}</p>
                  <div className="mt-3 grid gap-2 text-sm font-bold text-zinc-700 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">{t.productTotal}</p>
                      <p className="mt-1 text-zinc-950">{formatPhp(sale.productTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">{t.discount}</p>
                      <p className="mt-1 text-zinc-950">{formatPhp(sale.discountAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">{t.amountDue}</p>
                      <p className="mt-1 text-[#f65f18]">{formatPhp(sale.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm font-bold text-zinc-600 sm:grid-cols-2">
                    <p>
                      {t.priceNotes}: {sale.priceChangeNotes || "-"}
                    </p>
                    <p>
                      {t.saleNotes}: {sale.saleNotes || "-"}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">{t.auditTrail}</p>
                  {sale.auditLogs.length ? (
                    <div className="mt-3 space-y-2">
                      {sale.auditLogs.map((log) => (
                        <div key={log.id} className="rounded-md border border-zinc-200 bg-white p-3 text-xs font-bold text-zinc-600">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-black text-zinc-950">{auditActionLabel(log.action, language)}</span>
                            <span>{shortDate(log.createdAt)}</span>
                          </div>
                          <p className="mt-1">
                            {t.by}: {log.createdByName || "-"}
                          </p>
                          <p className="mt-1">
                            {t.statusChange}: {log.previousStatus || "-"} {"->"} {log.newStatus || "-"}
                          </p>
                          <p className="mt-1">
                            {t.reason}: {log.reason || "-"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm font-bold text-zinc-500">{t.noAudit}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">{t.cashierAction}</p>
                <p className="mt-1 text-sm font-bold text-zinc-600">
                  {isTransferPayment(sale.paymentMethod) ? t.transferConfirmHint : t.cashConfirmHint}
                </p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto_auto]">
                <input
                  className={inputClass()}
                  placeholder={isTransferPayment(sale.paymentMethod) ? t.referenceNo : `${t.referenceNo} (${paymentMethodLabel(sale.paymentMethod, language)})`}
                  value={transferReference}
                  disabled={!needsReference}
                  onChange={(event) => setReferenceNoBySale((current) => ({ ...current, [sale.id]: event.target.value }))}
                />
                <input className={inputClass()} placeholder={t.notes} value={notesBySale[sale.id] ?? ""} onChange={(event) => setNotesBySale((current) => ({ ...current, [sale.id]: event.target.value }))} />
                <button type="button" disabled={loading} onClick={() => printPosSale(sale)} className="rounded-md border border-zinc-200 px-5 py-2 text-sm font-black text-zinc-700 disabled:opacity-60">
                  {t.printA6}
                </button>
                <button type="button" disabled={loading} onClick={() => void returnToSales(sale)} className="rounded-md border border-amber-200 bg-amber-50 px-5 py-2 text-sm font-black text-amber-800 disabled:opacity-60">
                  {actionText.returnToSales}
                </button>
                <button type="button" disabled={loading || !canConfirm} onClick={() => void confirm(sale)} className="rounded-md bg-[#f65f18] px-5 py-2 text-sm font-black text-white disabled:opacity-60">
                  {t.confirmPayment}
                </button>
              </div>
              {needsReference && !canConfirm ? <p className="mt-2 text-sm font-black text-red-700">{t.referenceRequired}</p> : null}
            </section>
            );
          })
        ) : (
          <section className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm font-bold text-zinc-500 shadow-sm">{t.noSales}</section>
        )}
      </div>
      <AdminPosSalePrintTemplate sale={printSale} />
    </div>
  );
}
