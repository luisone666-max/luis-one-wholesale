"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AdminCashDrawerPrintTemplate } from "@/components/admin/AdminCashDrawerPrintTemplate";
import { AdminOperationGuide, AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import type { CashDrawerData } from "@/lib/cash-drawer-data";
import { formatPhp } from "@/lib/wholesale-pricing";

const copy = {
  en: {
    caption: "Track daily opening cash, offline cash payments, GCash / bank transfer totals, cash adjustments, and closing variance.",
    businessDate: "Business Date",
    openDrawer: "Open Cash Drawer",
    openingCash: "Opening Cash",
    openingNotes: "Opening Notes",
    offlineSalesTotal: "Offline Sales Total",
    cashSales: "Cash Received",
    transferSales: "GCash / Bank Transfer",
    gcashSales: "GCash Received",
    bankTransferSales: "Bank Transfer Received",
    otherSales: "Other Payment",
    cashInAdjustment: "Cash In Adjustment",
    cashOut: "Cash Out",
    expectedCash: "Expected Cash",
    actualCash: "Actual Cash Count",
    difference: "Difference",
    closePreview: "Close Preview",
    balanced: "Cash drawer balances.",
    varianceNeedsReview: "Variance needs review before closing.",
    varianceCheckHint: "Check missing cashier confirmations, cash-out entries, change fund, or manual cash adjustments before closing.",
    paymentBreakdown: "Payment Breakdown",
    paymentMethod: "Payment Method",
    addEntry: "Add Cash Entry",
    entryType: "Entry Type",
    amount: "Amount",
    reason: "Reason",
    notes: "Notes",
    closeDrawer: "Close Drawer",
    printSummary: "Print Daily Summary",
    closingNotes: "Closing Notes",
    entries: "Cash Entries",
    refresh: "Refresh",
    noSession: "No cash drawer session for this date yet.",
    noEntries: "No cash entries yet.",
    noPayments: "No offline cashier payments for this date yet.",
    openedBy: "Opened by",
    status: "Status",
    opened: "Open",
    closed: "Closed",
    saved: "Saved.",
    cashOutOption: "Cash out / expense",
    cashInOption: "Cash in adjustment",
    closeHint: "Expected cash = opening cash + confirmed cash payments + cash-in adjustments - cash-out entries. GCash and bank transfers are shown separately and are not added to the physical cash box.",
    scopeNote: "Cash drawer is for offline POS cashier-confirmed payments only. Online website orders stay in Online Orders / Payments.",
    reconciliationStatus: "Daily Cash Reconciliation",
    physicalCashFormula: "Physical cash formula",
    transferNotInBox: "GCash / bank transfers are tracked separately and do not enter the physical cash box.",
    plus: "plus",
    minus: "minus",
    equals: "equals",
    closeReady: "Ready to close after actual cash count.",
    countActualCash: "Count actual cash to preview the difference.",
    roleGuideTitle: "Daily cash drawer is for physical cash control",
    roleGuideBody: "Open the drawer with change fund, cashier confirmations update totals automatically, then count actual cash before closing.",
    roleGuideWarning: "GCash and bank transfers are visible here for daily sales reporting, but they do not enter the physical cash box.",
    flowStep1: "1. Open drawer",
    flowStep2: "2. Record cash in / cash out",
    flowStep3: "3. Count and close",
  },
};

const zhCopy = {
  caption: "记录每日开店备用现金、线下现金收款、GCash / 银行转账、现金调整和关账差额。",
  businessDate: "营业日期",
  openDrawer: "打开今日钱箱",
  openingCash: "开店备用现金",
  openingNotes: "开店备注",
  offlineSalesTotal: "线下总销售额",
  cashSales: "现金收入",
  transferSales: "GCash / 银行转账",
  gcashSales: "GCash 收入",
  bankTransferSales: "银行转账收入",
  otherSales: "其他收款",
  cashInAdjustment: "补入现金",
  cashOut: "现金支出",
  expectedCash: "系统应有现金",
  actualCash: "实际点现金",
  difference: "差额",
  closePreview: "关账预览",
  balanced: "钱箱金额一致。",
  varianceNeedsReview: "关账前请检查差额。",
  varianceCheckHint: "请检查是否有漏确认收款、现金支出、备用找零或手动现金调整记录。",
  paymentBreakdown: "收款方式汇总",
  paymentMethod: "收款方式",
  addEntry: "新增现金记录",
  entryType: "记录类型",
  amount: "金额",
  reason: "原因",
  notes: "备注",
  closeDrawer: "关账",
  printSummary: "打印日结",
  closingNotes: "关账备注",
  entries: "现金记录",
  refresh: "刷新",
  noSession: "这个日期还没有打开钱箱。",
  noEntries: "还没有现金支出或补现金记录。",
  noPayments: "这个日期还没有已确认的线下收款记录。",
  openedBy: "开账人员",
  status: "状态",
  opened: "进行中",
  closed: "已关账",
  saved: "已保存。",
  cashOutOption: "现金支出 / 费用",
  cashInOption: "补入现金",
  closeHint: "系统应有现金 = 开店备用现金 + 已确认现金收款 + 补入现金 - 现金支出。GCash 和银行转账会单独显示，不加入实体钱箱现金。",
  scopeNote: "钱箱只统计线下 POS 收银员已确认的收款。网站线上订单仍在“线上订单 / 付款”里处理。",
  reconciliationStatus: "\u6bcf\u65e5\u73b0\u91d1\u5bf9\u8d26",
  physicalCashFormula: "\u5b9e\u4f53\u94b1\u7bb1\u516c\u5f0f",
  transferNotInBox: "GCash / \u94f6\u884c\u8f6c\u8d26\u5355\u72ec\u7edf\u8ba1\uff0c\u4e0d\u8fdb\u5b9e\u4f53\u94b1\u7bb1\u3002",
  plus: "\u52a0",
  minus: "\u51cf",
  equals: "\u7b49\u4e8e",
  closeReady: "\u70b9\u5b8c\u5b9e\u9645\u73b0\u91d1\u540e\u53ef\u4ee5\u5173\u8d26\u3002",
  countActualCash: "\u8bf7\u5148\u70b9\u7b97\u5b9e\u9645\u73b0\u91d1\uff0c\u518d\u9884\u89c8\u5dee\u989d\u3002",
  roleGuideTitle: "\u6bcf\u65e5\u94b1\u7bb1\u53ea\u7528\u6765\u7ba1\u5b9e\u4f53\u73b0\u91d1",
  roleGuideBody: "\u5148\u7528\u5907\u7528\u627e\u96f6\u6253\u5f00\u94b1\u7bb1\uff0c\u6536\u94f6\u786e\u8ba4\u4f1a\u81ea\u52a8\u66f4\u65b0\u91d1\u989d\uff0c\u5173\u8d26\u524d\u8981\u70b9\u7b97\u5b9e\u9645\u73b0\u91d1\u3002",
  roleGuideWarning: "GCash \u548c\u94f6\u884c\u8f6c\u8d26\u4f1a\u5728\u8fd9\u91cc\u663e\u793a\u65b9\u4fbf\u770b\u65e5\u9500\u552e\uff0c\u4f46\u4e0d\u8fdb\u5b9e\u4f53\u94b1\u7bb1\u3002",
  flowStep1: "1. \u6253\u5f00\u94b1\u7bb1",
  flowStep2: "2. \u8bb0\u5f55\u8865\u73b0\u91d1 / \u73b0\u91d1\u652f\u51fa",
  flowStep3: "3. \u70b9\u94b1\u5e76\u5173\u8d26",
} satisfies typeof copy.en;

type ApiResult = (CashDrawerData & { ok: true }) | { ok: false; message?: string };

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function inputClass() {
  return "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
}

function Card({ title, value, tone = "neutral" }: { title: string; value: string; tone?: "orange" | "green" | "neutral" }) {
  const toneClass = {
    green: "text-emerald-700",
    neutral: "text-zinc-950",
    orange: "text-[#f65f18]",
  }[tone];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">{title}</p>
      <p className={`mt-2 text-xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function FormulaStep({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "orange" | "green" | "neutral" }) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    neutral: "bg-white text-zinc-900 ring-zinc-200",
    orange: "bg-orange-50 text-orange-800 ring-orange-100",
  }[tone];

  return (
    <div className={`rounded-md px-3 py-2 ring-1 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] opacity-70">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

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

export function AdminCashDrawerClient({ initialData }: { initialData: CashDrawerData }) {
  const { language } = useAdminI18n();
  const t = language === "zh" ? zhCopy : copy.en;
  const [data, setData] = useState(initialData);
  const [businessDate, setBusinessDate] = useState(initialData.businessDate);
  const [openingCash, setOpeningCash] = useState("");
  const [openingNotes, setOpeningNotes] = useState("");
  const [entryType, setEntryType] = useState("cash_out");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryReason, setEntryReason] = useState("");
  const [entryNotes, setEntryNotes] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [message, setMessage] = useState(initialData.error ?? "");
  const [loading, setLoading] = useState(false);

  const session = data.session;
  const isClosed = session?.status === "closed";
  const actualCashNumber = Number(actualCash);
  const hasActualCashInput = actualCash.trim() !== "" && Number.isFinite(actualCashNumber);
  const liveDifference = hasActualCashInput ? Math.round((actualCashNumber - data.expectedCash) * 100) / 100 : null;
  const closedDifference = session?.differenceAmount ?? null;
  const displayedDifference = isClosed ? closedDifference : liveDifference;
  const displayedActualCash = isClosed ? (session?.actualCash ?? null) : hasActualCashInput ? actualCashNumber : null;
  const hasDisplayedDifference = displayedDifference !== null;
  const hasVariance = hasDisplayedDifference && Math.abs(displayedDifference) >= 0.01;
  const varianceTone = useMemo(() => {
    if (displayedDifference === null) {
      return "green";
    }

    return Math.abs(displayedDifference) < 0.01 ? "green" : "orange";
  }, [displayedDifference]);

  async function load(date = businessDate) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/cash-drawer?date=${encodeURIComponent(date)}`);
      const result = (await response.json()) as ApiResult;

      if (!result.ok) {
        setMessage(result.message ?? "Unable to load cash drawer.");
        return;
      }

      setData(result);
      setBusinessDate(result.businessDate);
    } catch {
      setMessage("Unable to load cash drawer.");
    } finally {
      setLoading(false);
    }
  }

  async function post(payload: Record<string, unknown>, onSuccess?: () => void) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/cash-drawer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResult;

      if (!result.ok) {
        setMessage(result.message ?? "Unable to save cash drawer.");
        return;
      }

      setData(result);
      setBusinessDate(result.businessDate);
      setMessage(t.saved);
      onSuccess?.();
    } catch {
      setMessage("Unable to save cash drawer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageTitle titleKey="cashDrawer" caption={t.caption} />

      {message ? <div className="rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-800">{message}</div> : null}

      <AdminOperationGuide
        label={t.status}
        title={t.roleGuideTitle}
        body={`${t.roleGuideBody} ${t.scopeNote}`}
        warning={t.roleGuideWarning}
        steps={[t.flowStep1, t.flowStep2, t.flowStep3]}
        tone="neutral"
      />

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">{t.reconciliationStatus}</p>
            <h2 className="mt-1 text-lg font-black text-zinc-950">{t.physicalCashFormula}</h2>
            <p className="mt-1 text-xs font-bold text-zinc-500">{t.transferNotInBox}</p>
          </div>
          <StatusPill tone={hasActualCashInput || isClosed ? varianceTone : "orange"}>{hasActualCashInput || isClosed ? t.closeReady : t.countActualCash}</StatusPill>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-7">
          <FormulaStep label={t.openingCash} value={formatPhp(session?.openingCash ?? 0)} />
          <FormulaStep label={t.plus} value={formatPhp(data.cashSalesTotal)} tone="green" />
          <FormulaStep label={t.plus} value={formatPhp(data.cashInAdjustmentTotal)} />
          <FormulaStep label={t.minus} value={formatPhp(data.cashOutTotal)} tone="orange" />
          <FormulaStep label={t.equals} value={formatPhp(data.expectedCash)} tone="green" />
          <FormulaStep label={t.transferSales} value={formatPhp(data.transferSalesTotal)} />
          <FormulaStep label={t.difference} value={displayedDifference === null ? "-" : formatPhp(displayedDifference)} tone={varianceTone} />
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[220px_1fr_auto_auto] md:items-end">
          <Field label={t.businessDate}>
            <input className={inputClass()} type="date" value={businessDate} onChange={(event) => setBusinessDate(event.target.value)} />
          </Field>
          <div className="text-sm font-bold text-zinc-500">
            {session ? (
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={isClosed ? "neutral" : "green"}>{isClosed ? t.closed : t.opened}</StatusPill>
                <span>
                  {t.openedBy}: {session.cashierName || "-"}
                </span>
              </div>
            ) : (
              t.noSession
            )}
          </div>
          <button type="button" onClick={() => void load(businessDate)} disabled={loading} className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700 disabled:opacity-60">
            {t.refresh}
          </button>
          <button type="button" onClick={() => window.print()} disabled={!session} className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-black text-white disabled:opacity-40">
            {t.printSummary}
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card title={t.offlineSalesTotal} value={formatPhp(data.offlineSalesTotal)} tone="orange" />
        <Card title={t.cashSales} value={formatPhp(data.cashSalesTotal)} tone="green" />
        <Card title={t.gcashSales} value={formatPhp(data.gcashSalesTotal)} />
        <Card title={t.bankTransferSales} value={formatPhp(data.bankTransferSalesTotal)} />
        <Card title={t.expectedCash} value={formatPhp(data.expectedCash)} tone="green" />
      </section>

      {data.otherSalesTotal > 0 ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-black text-amber-900">
          {t.otherSales}: {formatPhp(data.otherSalesTotal)}
        </section>
      ) : null}

      {!session ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-zinc-950">{t.openDrawer}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label={t.openingCash}>
              <input className={inputClass()} type="number" min="0" step="0.01" value={openingCash} onChange={(event) => setOpeningCash(event.target.value)} />
            </Field>
            <Field label={t.openingNotes}>
              <input className={inputClass()} value={openingNotes} onChange={(event) => setOpeningNotes(event.target.value)} />
            </Field>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void post({ action: "open", businessDate, openingCash, notes: openingNotes }, () => {
                setOpeningCash("");
                setOpeningNotes("");
              })
            }
            className="mt-4 rounded-md bg-[#f65f18] px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
          >
            {t.openDrawer}
          </button>
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Card title={t.openingCash} value={formatPhp(session.openingCash)} />
            <Card title={t.cashInAdjustment} value={formatPhp(data.cashInAdjustmentTotal)} />
            <Card title={t.cashOut} value={formatPhp(data.cashOutTotal)} tone="orange" />
            <Card title={t.actualCash} value={displayedActualCash === null ? "-" : formatPhp(displayedActualCash)} />
            <Card title={t.difference} value={displayedDifference === null ? "-" : formatPhp(displayedDifference)} tone={varianceTone} />
            <Card title={t.status} value={isClosed ? t.closed : t.opened} />
          </section>

          {isClosed && hasDisplayedDifference ? (
            <section className={`rounded-lg border p-4 text-sm font-bold leading-6 ${hasVariance ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
              <p className="text-base font-black">{hasVariance ? t.varianceNeedsReview : t.balanced}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <span>
                  {t.expectedCash}: {formatPhp(data.expectedCash)}
                </span>
                <span>
                  {t.actualCash}: {displayedActualCash === null ? "-" : formatPhp(displayedActualCash)}
                </span>
                <span>
                  {t.difference}: {formatPhp(displayedDifference ?? 0)}
                </span>
              </div>
              {hasVariance ? <p className="mt-2 text-xs font-black">{t.varianceCheckHint}</p> : null}
            </section>
          ) : null}

          {!isClosed ? (
            <section className="grid gap-5 xl:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-black text-zinc-950">{t.addEntry}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label={t.entryType}>
                    <select className={inputClass()} value={entryType} onChange={(event) => setEntryType(event.target.value)}>
                      <option value="cash_out">{t.cashOutOption}</option>
                      <option value="cash_in_adjustment">{t.cashInOption}</option>
                    </select>
                  </Field>
                  <Field label={t.amount}>
                    <input className={inputClass()} type="number" min="0.01" step="0.01" value={entryAmount} onChange={(event) => setEntryAmount(event.target.value)} />
                  </Field>
                  <Field label={t.reason}>
                    <input className={inputClass()} value={entryReason} onChange={(event) => setEntryReason(event.target.value)} />
                  </Field>
                  <Field label={t.notes}>
                    <input className={inputClass()} value={entryNotes} onChange={(event) => setEntryNotes(event.target.value)} />
                  </Field>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    void post({ action: "add_entry", sessionId: session.id, entryType, amount: entryAmount, reason: entryReason, notes: entryNotes }, () => {
                      setEntryAmount("");
                      setEntryReason("");
                      setEntryNotes("");
                    })
                  }
                  className="mt-4 rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
                >
                  {t.addEntry}
                </button>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-black text-zinc-950">{t.closeDrawer}</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-zinc-500">{t.closeHint}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label={t.actualCash}>
                    <input className={inputClass()} type="number" min="0" step="0.01" value={actualCash} onChange={(event) => setActualCash(event.target.value)} />
                  </Field>
                  <Field label={t.closingNotes}>
                    <input className={inputClass()} value={closingNotes} onChange={(event) => setClosingNotes(event.target.value)} />
                  </Field>
                </div>
                {hasActualCashInput && liveDifference !== null ? (
                  <div className={`mt-4 rounded-md border p-3 text-sm font-bold leading-6 ${hasVariance ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
                    <p className="font-black">{t.closePreview}</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <span>
                        {t.expectedCash}: {formatPhp(data.expectedCash)}
                      </span>
                      <span>
                        {t.actualCash}: {formatPhp(actualCashNumber)}
                      </span>
                      <span>
                        {t.difference}: {formatPhp(liveDifference)}
                      </span>
                    </div>
                    <p className="mt-2">{hasVariance ? t.varianceNeedsReview : t.balanced}</p>
                    {hasVariance ? <p className="mt-1 text-xs font-black">{t.varianceCheckHint}</p> : null}
                  </div>
                ) : null}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    void post({ action: "close", sessionId: session.id, actualCash, notes: closingNotes }, () => {
                      setActualCash("");
                      setClosingNotes("");
                    })
                  }
                  className="mt-4 rounded-md bg-[#f65f18] px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
                >
                  {t.closeDrawer}
                </button>
              </div>
            </section>
          ) : null}

          <section className="grid gap-5 xl:grid-cols-2">
            <div>
              <h2 className="mb-3 text-lg font-black text-zinc-950">{t.entries}</h2>
              <TableShell>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-100 text-sm">
                    <thead className="bg-zinc-50 text-left text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
                      <tr>
                        <th className="px-4 py-3">{t.entryType}</th>
                        <th className="px-4 py-3">{t.amount}</th>
                        <th className="px-4 py-3">{t.reason}</th>
                        <th className="px-4 py-3">{t.notes}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {data.entries.length ? (
                        data.entries.map((entry) => (
                          <tr key={entry.id}>
                            <td className="px-4 py-3 font-black text-zinc-900">{entry.entryType === "cash_out" ? t.cashOutOption : t.cashInOption}</td>
                            <td className="px-4 py-3 font-black text-zinc-900">{formatPhp(entry.amount)}</td>
                            <td className="px-4 py-3 text-zinc-600">{entry.reason}</td>
                            <td className="px-4 py-3 text-zinc-600">{entry.notes || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-6 text-center text-sm font-bold text-zinc-500" colSpan={4}>
                            {t.noEntries}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TableShell>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-black text-zinc-950">{t.paymentBreakdown}</h2>
              <TableShell>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-100 text-sm">
                    <thead className="bg-zinc-50 text-left text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
                      <tr>
                        <th className="px-4 py-3">{t.paymentMethod}</th>
                        <th className="px-4 py-3">{t.amount}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {data.paymentBreakdown.length ? (
                        data.paymentBreakdown.map((payment) => (
                          <tr key={payment.method}>
                            <td className="px-4 py-3 font-black text-zinc-900">{paymentMethodLabel(payment.method, language)}</td>
                            <td className="px-4 py-3 font-black text-zinc-900">{formatPhp(payment.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-6 text-center text-sm font-bold text-zinc-500" colSpan={2}>
                            {t.noPayments}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TableShell>
            </div>
          </section>
        </>
      )}
      <AdminCashDrawerPrintTemplate data={data} />
    </div>
  );
}
