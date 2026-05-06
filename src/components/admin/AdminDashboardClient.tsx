"use client";

import Link from "next/link";
import { AdminPageTitle, StatusPill } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import type { AdminDashboardData } from "@/lib/admin-dashboard-data";
import { formatPhp } from "@/lib/wholesale-pricing";

const copy = {
  en: {
    caption: "Real business overview from Supabase. Test orders disappear here after deletion.",
    quickActions: "Quick actions",
    addCategory: "Add Category",
    addProduct: "Add Product",
    onlineOrders: "Online Orders",
    offlineCashier: "Cashier",
    todayOnlineOrders: "Today Online Orders",
    todayOfflineSales: "Today Offline Sales",
    cashReceived: "Cash Received",
    transferReceived: "GCash / Bank Transfer",
    pendingOnlineOrders: "Pending Online Orders",
    waitingCashier: "Waiting Cashier",
    customers: "Customers",
    activeCustomers: "Active Customers",
    activeProducts: "Active Products",
    hiddenProducts: "Hidden Products",
    lowStockProducts: "Low / Unavailable",
    recentOrders: "Recent Online Orders",
    noOrders: "No online orders.",
    customer: "Customer",
    status: "Status",
    total: "Total",
    dataNote: "Offline sales here are cashier-confirmed payments. Online order total is submitted website order value.",
  },
  zh: {
    caption: "这里显示 Supabase 真实经营数据。测试订单删除后，仪表盘也会同步更新。",
    quickActions: "快捷入口",
    addCategory: "添加分类",
    addProduct: "添加商品",
    onlineOrders: "线上订单",
    offlineCashier: "收银中心",
    todayOnlineOrders: "今日线上订单金额",
    todayOfflineSales: "今日线下已收款",
    cashReceived: "现金收入",
    transferReceived: "GCash / 银行转账",
    pendingOnlineOrders: "待确认线上订单",
    waitingCashier: "等待收银",
    customers: "客户",
    activeCustomers: "活跃客户",
    activeProducts: "上架商品",
    hiddenProducts: "隐藏商品",
    lowStockProducts: "低库存 / 缺货",
    recentOrders: "最近线上订单",
    noOrders: "暂无线上订单。",
    customer: "客户",
    status: "状态",
    total: "金额",
    dataNote: "这里的线下销售额只统计收银员已确认收款；线上订单金额是客户提交的订单金额，付款仍需人工确认。",
  },
};

function StatCard({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "orange" | "green" | "neutral" }) {
  const toneClass = {
    green: "text-emerald-700",
    neutral: "text-zinc-950",
    orange: "text-[#f65f18]",
  }[tone];

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-zinc-500">{label}</p>
      <p className={`mt-3 text-2xl font-black tracking-tight ${toneClass}`}>{value}</p>
      <div className="mt-4 h-1.5 rounded-full bg-orange-100">
        <div className="h-1.5 w-2/3 rounded-full bg-[#f65f18]" />
      </div>
    </div>
  );
}

function orderStatusLabel(status: string, language: "en" | "zh") {
  const labels: Record<string, { en: string; zh: string }> = {
    pending_confirmation: { en: "Pending Confirmation", zh: "待确认" },
    waiting_deposit: { en: "Waiting Deposit", zh: "等待定金" },
    deposit_paid: { en: "Deposit Paid", zh: "已付定金" },
    sourcing_items: { en: "Sourcing Items", zh: "备货中" },
    ready_for_pickup: { en: "Ready", zh: "可取货" },
    completed: { en: "Completed", zh: "已完成" },
    cancelled: { en: "Cancelled", zh: "已取消" },
  };

  return labels[status]?.[language] ?? status;
}

export function AdminDashboardClient({ data }: { data: AdminDashboardData }) {
  const { language } = useAdminI18n();
  const text = copy[language];

  return (
    <>
      <AdminPageTitle titleKey="dashboard" caption={text.caption} />
      {data.error ? <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-800">{data.error}</div> : null}

      <div className="mb-5 rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-400">{text.quickActions}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/categories" className="rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white">
            {text.addCategory}
          </Link>
          <Link href="/admin/products" className="rounded-md border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
            {text.addProduct}
          </Link>
          <Link href="/admin/orders" className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700">
            {text.onlineOrders}
          </Link>
          <Link href="/admin/cashier" className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700">
            {text.offlineCashier}
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={text.todayOnlineOrders} value={formatPhp(data.onlineOrdersTodayTotal)} tone="orange" />
        <StatCard label={text.todayOfflineSales} value={formatPhp(data.offlineSalesTodayTotal)} tone="orange" />
        <StatCard label={text.cashReceived} value={formatPhp(data.offlineCashTodayTotal)} tone="green" />
        <StatCard label={text.transferReceived} value={formatPhp(data.offlineTransferTodayTotal)} />
        <StatCard label={text.pendingOnlineOrders} value={data.pendingOnlineOrders} />
        <StatCard label={text.waitingCashier} value={data.waitingCashierCount} />
        <StatCard label={text.customers} value={data.customerCount} tone="green" />
        <StatCard label={text.activeCustomers} value={data.activeCustomerCount} />
        <StatCard label={text.activeProducts} value={data.activeProducts} tone="green" />
        <StatCard label={text.hiddenProducts} value={data.hiddenProducts} />
        <StatCard label={text.lowStockProducts} value={data.lowStockProducts} tone="orange" />
      </section>
      <p className="mt-3 rounded-md border border-orange-100 bg-orange-50 px-4 py-3 text-xs font-bold text-orange-800">{text.dataNote}</p>

      <section className="mt-6 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-zinc-950">{text.recentOrders}</h2>
          <StatusPill tone="orange">{data.pendingOnlineOrders}</StatusPill>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">Order No</th>
                <th className="px-4 py-3">{text.customer}</th>
                <th className="px-4 py-3">{text.status}</th>
                <th className="px-4 py-3">{text.total}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.recentOrders.length ? (
                data.recentOrders.map((order) => (
                  <tr key={order.orderNo}>
                    <td className="px-4 py-4 font-black text-zinc-900">{order.orderNo}</td>
                    <td className="px-4 py-4 text-zinc-600">{order.customerName}</td>
                    <td className="px-4 py-4 text-zinc-600">{orderStatusLabel(order.orderStatus, language)}</td>
                    <td className="px-4 py-4 font-black text-orange-700">{formatPhp(order.productTotal)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-sm font-bold text-zinc-500" colSpan={4}>
                    {text.noOrders}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
