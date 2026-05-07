import "server-only";

import { getEmployeeSalesReport } from "@/lib/employee-sales-report-data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminDashboardOrder = {
  orderNo: string;
  customerName: string;
  orderStatus: string;
  productTotal: number;
};

export type AdminDashboardEmployee = {
  salesName: string;
  orderCount: number;
  productTotal: number;
  paidTotal: number;
};

export type AdminDashboardData = {
  activeProducts: number;
  hiddenProducts: number;
  lowStockProducts: number;
  pendingOnlineOrders: number;
  todaySalesTotal: number;
  todayPaidTotal: number;
  todayPendingOnlineTotal: number;
  todayWaitingCashierTotal: number;
  monthSalesTotal: number;
  monthPaidTotal: number;
  onlineOrdersTodayTotal: number;
  offlineSalesTodayTotal: number;
  offlineCashTodayTotal: number;
  offlineTransferTodayTotal: number;
  todayGcashTotal: number;
  todayBankTransferTotal: number;
  todayOtherPaymentTotal: number;
  waitingCashierCount: number;
  customerCount: number;
  activeCustomerCount: number;
  topEmployees: AdminDashboardEmployee[];
  recentOrders: AdminDashboardOrder[];
  error?: string;
};

function todayManilaRange() {
  const businessDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return {
    start: `${businessDate}T00:00:00+08:00`,
    end: `${businessDate}T23:59:59+08:00`,
  };
}

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = createSupabaseAdminClient();
  const empty: AdminDashboardData = {
    activeProducts: 0,
    hiddenProducts: 0,
    lowStockProducts: 0,
    pendingOnlineOrders: 0,
    todaySalesTotal: 0,
    todayPaidTotal: 0,
    todayPendingOnlineTotal: 0,
    todayWaitingCashierTotal: 0,
    monthSalesTotal: 0,
    monthPaidTotal: 0,
    onlineOrdersTodayTotal: 0,
    offlineSalesTodayTotal: 0,
    offlineCashTodayTotal: 0,
    offlineTransferTodayTotal: 0,
    todayGcashTotal: 0,
    todayBankTransferTotal: 0,
    todayOtherPaymentTotal: 0,
    waitingCashierCount: 0,
    customerCount: 0,
    activeCustomerCount: 0,
    topEmployees: [],
    recentOrders: [],
  };

  if (!supabase) {
    return { ...empty, error: "Supabase admin client is not configured." };
  }

  const { start, end } = todayManilaRange();
  const [
    activeProducts,
    hiddenProducts,
    lowStockProducts,
    pendingOnlineOrders,
    waitingCashierCount,
    customerCount,
    activeCustomerCount,
    onlineOrdersResult,
    posPaymentsResult,
    recentOrdersResult,
    reportResult,
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("active", false),
    supabase.from("products").select("id", { count: "exact", head: true }).in("stock_status", ["low_stock", "unavailable"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("order_status", "pending_confirmation"),
    supabase.from("pos_sales").select("id", { count: "exact", head: true }).eq("status", "waiting_cashier"),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("orders").select("product_total,created_at").gte("created_at", start).lte("created_at", end),
    supabase.from("pos_payment_confirmations").select("payment_method,amount,confirmed_at").gte("confirmed_at", start).lte("confirmed_at", end),
    supabase
      .from("orders")
      .select("order_no,receiver_name,product_total,order_status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    getEmployeeSalesReport(),
  ]);

  const errors = [
    activeProducts.error?.message,
    hiddenProducts.error?.message,
    lowStockProducts.error?.message,
    pendingOnlineOrders.error?.message,
    waitingCashierCount.error?.message,
    customerCount.error?.message,
    activeCustomerCount.error?.message,
    onlineOrdersResult.error?.message,
    posPaymentsResult.error?.message,
    recentOrdersResult.error?.message,
    reportResult.error,
  ].filter(Boolean);

  const onlineOrdersTodayTotal = ((onlineOrdersResult.data ?? []) as Array<{ product_total: number | string | null }>).reduce(
    (total, order) => total + toNumber(order.product_total),
    0,
  );

  let offlineSalesTodayTotal = 0;
  let offlineCashTodayTotal = 0;
  let offlineTransferTodayTotal = 0;

  for (const payment of (posPaymentsResult.data ?? []) as Array<{ payment_method: string | null; amount: number | string | null }>) {
    const amount = toNumber(payment.amount);
    offlineSalesTodayTotal += amount;

    const paymentMethod = (payment.payment_method ?? "").toLowerCase();

    if (paymentMethod === "cash") {
      offlineCashTodayTotal += amount;
    } else if (paymentMethod === "gcash") {
      offlineTransferTodayTotal += amount;
    } else if (paymentMethod === "bank_transfer") {
      offlineTransferTodayTotal += amount;
    } else {
      offlineTransferTodayTotal += amount;
    }
  }

  const currentMonth = reportResult.monthOptions[0] ?? "";
  const topEmployees = reportResult.rows
    .filter((row) => !currentMonth || row.month === currentMonth)
    .sort((a, b) => b.paidTotal - a.paidTotal || b.productTotal - a.productTotal)
    .slice(0, 5)
    .map((row) => ({
      salesName: row.salesName,
      orderCount: row.orderCount,
      productTotal: row.productTotal,
      paidTotal: row.paidTotal,
    }));

  return {
    activeProducts: activeProducts.count ?? 0,
    hiddenProducts: hiddenProducts.count ?? 0,
    lowStockProducts: lowStockProducts.count ?? 0,
    pendingOnlineOrders: pendingOnlineOrders.count ?? 0,
    todaySalesTotal: reportResult.overview.todaySalesTotal,
    todayPaidTotal: reportResult.overview.todayPaidTotal,
    todayPendingOnlineTotal: reportResult.overview.todayPendingOnlineTotal,
    todayWaitingCashierTotal: reportResult.overview.todayWaitingCashierTotal,
    monthSalesTotal: reportResult.overview.monthSalesTotal,
    monthPaidTotal: reportResult.overview.monthPaidTotal,
    onlineOrdersTodayTotal,
    offlineSalesTodayTotal,
    offlineCashTodayTotal,
    offlineTransferTodayTotal,
    todayGcashTotal: reportResult.overview.todayGcashTotal,
    todayBankTransferTotal: reportResult.overview.todayBankTransferTotal,
    todayOtherPaymentTotal: reportResult.overview.todayOtherPaymentTotal,
    waitingCashierCount: waitingCashierCount.count ?? 0,
    customerCount: customerCount.count ?? 0,
    activeCustomerCount: activeCustomerCount.count ?? 0,
    topEmployees,
    recentOrders: ((recentOrdersResult.data ?? []) as Array<{
      order_no: string | null;
      receiver_name: string | null;
      product_total: number | string | null;
      order_status: string | null;
    }>).map((order) => ({
      orderNo: order.order_no ?? "",
      customerName: order.receiver_name ?? "-",
      orderStatus: order.order_status ?? "pending_confirmation",
      productTotal: toNumber(order.product_total),
    })),
    error: errors[0],
  };
}
