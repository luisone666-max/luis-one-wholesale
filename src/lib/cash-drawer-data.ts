import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type CashDrawerSession = {
  id: string;
  businessDate: string;
  cashierName: string;
  openingCash: number;
  expectedCash: number | null;
  actualCash: number | null;
  differenceAmount: number | null;
  status: string;
  openingNotes: string;
  closingNotes: string;
  openedAt: string;
  closedAt: string;
};

export type CashDrawerEntry = {
  id: string;
  sessionId: string;
  entryType: string;
  amount: number;
  reason: string;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type CashDrawerData = {
  businessDate: string;
  session: CashDrawerSession | null;
  entries: CashDrawerEntry[];
  offlineSalesTotal: number;
  cashSalesTotal: number;
  gcashSalesTotal: number;
  bankTransferSalesTotal: number;
  otherSalesTotal: number;
  transferSalesTotal: number;
  cashOutTotal: number;
  cashInAdjustmentTotal: number;
  expectedCash: number;
  paymentBreakdown: Array<{ method: string; amount: number }>;
  error?: string;
};

function todayManilaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizeDate(value?: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : todayManilaDate();
}

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function mapSession(row: Record<string, unknown>): CashDrawerSession {
  return {
    id: String(row.id),
    businessDate: String(row.business_date),
    cashierName: String(row.cashier_name_snapshot ?? "-"),
    openingCash: toNumber(row.opening_cash),
    expectedCash: row.expected_cash === null ? null : toNumber(row.expected_cash),
    actualCash: row.actual_cash === null ? null : toNumber(row.actual_cash),
    differenceAmount: row.difference_amount === null ? null : toNumber(row.difference_amount),
    status: String(row.status ?? "open"),
    openingNotes: String(row.opening_notes ?? ""),
    closingNotes: String(row.closing_notes ?? ""),
    openedAt: String(row.opened_at ?? ""),
    closedAt: String(row.closed_at ?? ""),
  };
}

function mapEntry(row: Record<string, unknown>): CashDrawerEntry {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    entryType: String(row.entry_type),
    amount: toNumber(row.amount),
    reason: String(row.reason ?? ""),
    notes: String(row.notes ?? ""),
    createdBy: String(row.created_by_name_snapshot ?? "-"),
    createdAt: String(row.created_at ?? ""),
  };
}

export async function getCashDrawerData(date?: string | null): Promise<CashDrawerData> {
  const businessDate = normalizeDate(date);
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return {
      businessDate,
      session: null,
      entries: [],
      offlineSalesTotal: 0,
      cashSalesTotal: 0,
      gcashSalesTotal: 0,
      bankTransferSalesTotal: 0,
      otherSalesTotal: 0,
      transferSalesTotal: 0,
      cashOutTotal: 0,
      cashInAdjustmentTotal: 0,
      expectedCash: 0,
      paymentBreakdown: [],
      error: "Supabase admin client is not configured.",
    };
  }

  const dayStart = `${businessDate}T00:00:00+08:00`;
  const dayEnd = `${businessDate}T23:59:59+08:00`;

  const [sessionResult, posPaymentsResult] = await Promise.all([
    admin.from("cash_drawer_sessions").select("*").eq("business_date", businessDate).maybeSingle(),
    admin
      .from("pos_payment_confirmations")
      .select("payment_method,amount,confirmed_at")
      .gte("confirmed_at", dayStart)
      .lte("confirmed_at", dayEnd),
  ]);

  if (sessionResult.error && sessionResult.error.code !== "PGRST116") {
    return {
      businessDate,
      session: null,
      entries: [],
      offlineSalesTotal: 0,
      cashSalesTotal: 0,
      gcashSalesTotal: 0,
      bankTransferSalesTotal: 0,
      otherSalesTotal: 0,
      transferSalesTotal: 0,
      cashOutTotal: 0,
      cashInAdjustmentTotal: 0,
      expectedCash: 0,
      paymentBreakdown: [],
      error: sessionResult.error.message,
    };
  }

  if (posPaymentsResult.error) {
    return {
      businessDate,
      session: null,
      entries: [],
      offlineSalesTotal: 0,
      cashSalesTotal: 0,
      gcashSalesTotal: 0,
      bankTransferSalesTotal: 0,
      otherSalesTotal: 0,
      transferSalesTotal: 0,
      cashOutTotal: 0,
      cashInAdjustmentTotal: 0,
      expectedCash: 0,
      paymentBreakdown: [],
      error: posPaymentsResult.error.message,
    };
  }

  const session = sessionResult.data ? mapSession(sessionResult.data as Record<string, unknown>) : null;
  const entriesResult = session
    ? await admin.from("cash_drawer_entries").select("*").eq("session_id", session.id).order("created_at", { ascending: false })
    : { data: [], error: null };

  if (entriesResult.error) {
    return {
      businessDate,
      session,
      entries: [],
      offlineSalesTotal: 0,
      cashSalesTotal: 0,
      gcashSalesTotal: 0,
      bankTransferSalesTotal: 0,
      otherSalesTotal: 0,
      transferSalesTotal: 0,
      cashOutTotal: 0,
      cashInAdjustmentTotal: 0,
      expectedCash: session?.openingCash ?? 0,
      paymentBreakdown: [],
      error: entriesResult.error.message,
    };
  }

  const entries = ((entriesResult.data ?? []) as Record<string, unknown>[]).map(mapEntry);
  const paymentBreakdownMap = new Map<string, number>();

  for (const payment of (posPaymentsResult.data ?? []) as Record<string, unknown>[]) {
    const method = String(payment.payment_method ?? "other").toLowerCase();
    paymentBreakdownMap.set(method, (paymentBreakdownMap.get(method) ?? 0) + toNumber(payment.amount));
  }

  const paymentBreakdown = Array.from(paymentBreakdownMap.entries()).map(([method, amount]) => ({ method, amount }));
  const cashSalesTotal = paymentBreakdownMap.get("cash") ?? 0;
  const gcashSalesTotal = paymentBreakdownMap.get("gcash") ?? 0;
  const bankTransferSalesTotal = paymentBreakdownMap.get("bank_transfer") ?? 0;
  const otherSalesTotal = paymentBreakdown
    .filter((payment) => payment.method !== "cash" && payment.method !== "gcash" && payment.method !== "bank_transfer")
    .reduce((total, payment) => total + payment.amount, 0);
  const offlineSalesTotal = paymentBreakdown.reduce((total, payment) => total + payment.amount, 0);
  const transferSalesTotal = gcashSalesTotal + bankTransferSalesTotal;
  const cashOutTotal = entries.filter((entry) => entry.entryType === "cash_out").reduce((total, entry) => total + entry.amount, 0);
  const cashInAdjustmentTotal = entries
    .filter((entry) => entry.entryType === "cash_in_adjustment" && !entry.reason.toLowerCase().startsWith("pos cash sale"))
    .reduce((total, entry) => total + entry.amount, 0);
  const expectedCash = (session?.openingCash ?? 0) + cashSalesTotal + cashInAdjustmentTotal - cashOutTotal;

  return {
    businessDate,
    session,
    entries,
    offlineSalesTotal,
    cashSalesTotal,
    gcashSalesTotal,
    bankTransferSalesTotal,
    otherSalesTotal,
    transferSalesTotal,
    cashOutTotal,
    cashInAdjustmentTotal,
    expectedCash,
    paymentBreakdown,
  };
}
