import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

type OrderSalesRow = {
  id: string;
  product_total: number | string | null;
  order_status: string | null;
  payment_status: string | null;
  sales_admin_user_id: string | null;
  sales_name_snapshot: string | null;
  created_at: string | null;
};

type PosSalesRow = {
  id: string;
  salesperson_admin_user_id: string | null;
  salesperson_employee_no: string | null;
  salesperson_name_snapshot: string | null;
  payment_method: string | null;
  total_amount: number | string | null;
  status: string | null;
  created_at: string | null;
};

type PosPaymentRow = {
  payment_method: string | null;
  amount: number | string | null;
  confirmed_at: string | null;
};

type OnlinePaymentRow = {
  payment_method: string | null;
  amount: number | string | null;
  status: string | null;
  created_at: string | null;
};

export type EmployeeSalesReportRow = {
  month: string;
  salesAdminUserId: string;
  salesName: string;
  orderCount: number;
  productTotal: number;
  onlineTotal: number;
  offlineTotal: number;
  waitingTotal: number;
  paidOrderCount: number;
  paidTotal: number;
};

export type BusinessReportOverview = {
  todaySalesTotal: number;
  todayPaidTotal: number;
  todayOnlineSubmittedTotal: number;
  todayOfflineSubmittedTotal: number;
  todayOnlinePaidTotal: number;
  todayOfflinePaidTotal: number;
  todayCashTotal: number;
  todayGcashTotal: number;
  todayBankTransferTotal: number;
  todayOtherPaymentTotal: number;
  todayWaitingCashierCount: number;
  todayWaitingCashierTotal: number;
  todayPendingOnlineCount: number;
  todayPendingOnlineTotal: number;
  monthSalesTotal: number;
  monthPaidTotal: number;
  monthOnlineSubmittedTotal: number;
  monthOfflineSubmittedTotal: number;
  monthOnlinePaidTotal: number;
  monthOfflinePaidTotal: number;
  monthCashTotal: number;
  monthGcashTotal: number;
  monthBankTransferTotal: number;
  monthOtherPaymentTotal: number;
  monthWaitingCashierCount: number;
  monthWaitingCashierTotal: number;
  monthPendingOnlineCount: number;
  monthPendingOnlineTotal: number;
};

export type EmployeeSalesReportResult = {
  rows: EmployeeSalesReportRow[];
  monthOptions: string[];
  overview: BusinessReportOverview;
  error?: string;
};

function emptyOverview(): BusinessReportOverview {
  return {
    todaySalesTotal: 0,
    todayPaidTotal: 0,
    todayOnlineSubmittedTotal: 0,
    todayOfflineSubmittedTotal: 0,
    todayOnlinePaidTotal: 0,
    todayOfflinePaidTotal: 0,
    todayCashTotal: 0,
    todayGcashTotal: 0,
    todayBankTransferTotal: 0,
    todayOtherPaymentTotal: 0,
    todayWaitingCashierCount: 0,
    todayWaitingCashierTotal: 0,
    todayPendingOnlineCount: 0,
    todayPendingOnlineTotal: 0,
    monthSalesTotal: 0,
    monthPaidTotal: 0,
    monthOnlineSubmittedTotal: 0,
    monthOfflineSubmittedTotal: 0,
    monthOnlinePaidTotal: 0,
    monthOfflinePaidTotal: 0,
    monthCashTotal: 0,
    monthGcashTotal: 0,
    monthBankTransferTotal: 0,
    monthOtherPaymentTotal: 0,
    monthWaitingCashierCount: 0,
    monthWaitingCashierTotal: 0,
    monthPendingOnlineCount: 0,
    monthPendingOnlineTotal: 0,
  };
}

function manilaCalendar() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const month = today.slice(0, 7);

  return {
    today,
    month,
    dayStart: `${today}T00:00:00+08:00`,
    dayEnd: `${today}T23:59:59+08:00`,
    monthStart: `${month}-01T00:00:00+08:00`,
  };
}

function monthKey(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return value.slice(0, 7);
}

function toNumber(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function isToday(value: string | null, dayStart: string, dayEnd: string) {
  return Boolean(value && value >= dayStart && value <= dayEnd);
}

function isCancelled(status: string | null) {
  return status === "cancelled" || status === "unavailable_refund";
}

function isPendingOnline(status: string | null) {
  return status === "pending_confirmation" || status === "waiting_deposit" || !status;
}

function isPaidOnline(status: string | null) {
  return status === "deposit_verified" || status === "fully_paid";
}

function isPaidPosSale(status: string | null) {
  return status === "paid";
}

function normalizePaymentMethod(method: string | null) {
  const clean = (method ?? "other").toLowerCase().replace(/[\s-]+/g, "_");

  if (clean.includes("gcash")) {
    return "gcash";
  }

  if (clean.includes("bank") || clean.includes("transfer")) {
    return "bank_transfer";
  }

  if (clean.includes("cash")) {
    return "cash";
  }

  return clean || "other";
}

function addPaymentByMethod(overview: BusinessReportOverview, method: string, amount: number, scope: "today" | "month") {
  const prefix = scope === "today" ? "today" : "month";

  if (method === "cash") {
    overview[`${prefix}CashTotal` as const] += amount;
    return;
  }

  if (method === "gcash") {
    overview[`${prefix}GcashTotal` as const] += amount;
    return;
  }

  if (method === "bank_transfer") {
    overview[`${prefix}BankTransferTotal` as const] += amount;
    return;
  }

  overview[`${prefix}OtherPaymentTotal` as const] += amount;
}

function getReportRow(grouped: Map<string, EmployeeSalesReportRow>, key: string, month: string, salesAdminUserId: string, salesName: string) {
  const current = grouped.get(key);

  if (current) {
    return current;
  }

  const next = {
    month,
    salesAdminUserId,
    salesName,
    orderCount: 0,
    productTotal: 0,
    onlineTotal: 0,
    offlineTotal: 0,
    waitingTotal: 0,
    paidOrderCount: 0,
    paidTotal: 0,
  } satisfies EmployeeSalesReportRow;

  grouped.set(key, next);
  return next;
}

export async function getEmployeeSalesReport(): Promise<EmployeeSalesReportResult> {
  const supabase = createSupabaseAdminClient();
  const overview = emptyOverview();

  if (!supabase) {
    return { rows: [], monthOptions: [], overview, error: "Supabase admin client is not configured." };
  }

  const { dayStart, dayEnd, monthStart } = manilaCalendar();
  const [ordersResult, posSalesResult, posPaymentsResult, onlinePaymentsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id,product_total,order_status,payment_status,sales_admin_user_id,sales_name_snapshot,created_at")
      .gte("created_at", monthStart)
      .order("created_at", { ascending: false }),
    supabase
      .from("pos_sales")
      .select("id,salesperson_admin_user_id,salesperson_employee_no,salesperson_name_snapshot,payment_method,total_amount,status,created_at")
      .gte("created_at", monthStart)
      .order("created_at", { ascending: false }),
    supabase
      .from("pos_payment_confirmations")
      .select("payment_method,amount,confirmed_at")
      .gte("confirmed_at", monthStart)
      .order("confirmed_at", { ascending: false }),
    supabase
      .from("payment_records")
      .select("payment_method,amount,status,created_at")
      .gte("created_at", monthStart)
      .order("created_at", { ascending: false }),
  ]);

  if (ordersResult.error) {
    return { rows: [], monthOptions: [], overview, error: ordersResult.error.message };
  }

  if (posSalesResult.error) {
    return { rows: [], monthOptions: [], overview, error: posSalesResult.error.message };
  }

  if (posPaymentsResult.error) {
    return { rows: [], monthOptions: [], overview, error: posPaymentsResult.error.message };
  }

  if (onlinePaymentsResult.error) {
    return { rows: [], monthOptions: [], overview, error: onlinePaymentsResult.error.message };
  }

  const grouped = new Map<string, EmployeeSalesReportRow>();
  const months = new Set<string>();

  for (const order of (ordersResult.data ?? []) as OrderSalesRow[]) {
    if (isCancelled(order.order_status)) {
      continue;
    }

    const amount = toNumber(order.product_total);
    const month = monthKey(order.created_at);
    const salesAdminUserId = order.sales_admin_user_id ?? "";
    const salesName = order.sales_name_snapshot || "Unassigned / Online order";
    const key = `${month}:${salesAdminUserId || "unassigned"}`;
    const current = getReportRow(grouped, key, month, salesAdminUserId, salesName);

    current.orderCount += 1;
    current.productTotal += amount;
    current.onlineTotal += amount;

    if (isPaidOnline(order.payment_status)) {
      current.paidOrderCount += 1;
      current.paidTotal += amount;
      overview.monthOnlinePaidTotal += amount;

      if (isToday(order.created_at, dayStart, dayEnd)) {
        overview.todayOnlinePaidTotal += amount;
      }
    }

    overview.monthOnlineSubmittedTotal += amount;

    if (isPendingOnline(order.order_status)) {
      current.waitingTotal += amount;
      overview.monthPendingOnlineCount += 1;
      overview.monthPendingOnlineTotal += amount;
    }

    if (isToday(order.created_at, dayStart, dayEnd)) {
      overview.todayOnlineSubmittedTotal += amount;

      if (isPendingOnline(order.order_status)) {
        overview.todayPendingOnlineCount += 1;
        overview.todayPendingOnlineTotal += amount;
      }
    }

    grouped.set(key, current);
    months.add(month);
  }

  for (const sale of (posSalesResult.data ?? []) as PosSalesRow[]) {
    if (sale.status === "cancelled") {
      continue;
    }

    const amount = toNumber(sale.total_amount);
    const month = monthKey(sale.created_at);
    const employeeKey = sale.salesperson_admin_user_id || sale.salesperson_employee_no || "unassigned-pos";
    const salesAdminUserId = sale.salesperson_admin_user_id || (sale.salesperson_employee_no ? `employee:${sale.salesperson_employee_no}` : "");
    const salesName = sale.salesperson_name_snapshot || (sale.salesperson_employee_no ? `Employee ${sale.salesperson_employee_no}` : "Unassigned / Offline sale");
    const key = `${month}:${employeeKey}`;
    const current = getReportRow(grouped, key, month, salesAdminUserId, salesName);

    current.orderCount += 1;
    current.productTotal += amount;
    current.offlineTotal += amount;
    overview.monthOfflineSubmittedTotal += amount;

    if (sale.status === "waiting_cashier") {
      current.waitingTotal += amount;
      overview.monthWaitingCashierCount += 1;
      overview.monthWaitingCashierTotal += amount;
    }

    if (isPaidPosSale(sale.status)) {
      current.paidOrderCount += 1;
      current.paidTotal += amount;
    }

    if (isToday(sale.created_at, dayStart, dayEnd)) {
      overview.todayOfflineSubmittedTotal += amount;

      if (sale.status === "waiting_cashier") {
        overview.todayWaitingCashierCount += 1;
        overview.todayWaitingCashierTotal += amount;
      }
    }

    months.add(month);
  }

  for (const payment of (posPaymentsResult.data ?? []) as PosPaymentRow[]) {
    const amount = toNumber(payment.amount);
    const method = normalizePaymentMethod(payment.payment_method);
    overview.monthOfflinePaidTotal += amount;
    addPaymentByMethod(overview, method, amount, "month");

    if (isToday(payment.confirmed_at, dayStart, dayEnd)) {
      overview.todayOfflinePaidTotal += amount;
      addPaymentByMethod(overview, method, amount, "today");
    }
  }

  for (const payment of (onlinePaymentsResult.data ?? []) as OnlinePaymentRow[]) {
    const amount = toNumber(payment.amount);
    const method = normalizePaymentMethod(payment.payment_method);
    const status = payment.status ?? "";

    if (status === "rejected" || status === "cancelled") {
      continue;
    }

    addPaymentByMethod(overview, method, amount, "month");

    if (isToday(payment.created_at, dayStart, dayEnd)) {
      addPaymentByMethod(overview, method, amount, "today");
    }
  }

  overview.todaySalesTotal = overview.todayOnlineSubmittedTotal + overview.todayOfflineSubmittedTotal;
  overview.monthSalesTotal = overview.monthOnlineSubmittedTotal + overview.monthOfflineSubmittedTotal;
  overview.todayPaidTotal = overview.todayOnlinePaidTotal + overview.todayOfflinePaidTotal;
  overview.monthPaidTotal = overview.monthOnlinePaidTotal + overview.monthOfflinePaidTotal;

  return {
    rows: Array.from(grouped.values()).sort((a, b) => (a.month === b.month ? b.productTotal - a.productTotal : b.month.localeCompare(a.month))),
    monthOptions: Array.from(months).sort((a, b) => b.localeCompare(a)),
    overview,
  };
}
