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

const readableDashboardZh = {
  caption: "\u8fd9\u91cc\u663e\u793a Supabase \u771f\u5b9e\u7ecf\u8425\u6570\u636e\u3002\u6d4b\u8bd5\u8ba2\u5355\u5220\u9664\u540e\uff0c\u4eea\u8868\u76d8\u4e5f\u4f1a\u540c\u6b65\u66f4\u65b0\u3002",
  quickActions: "\u5feb\u6377\u5165\u53e3",
  addCategory: "\u6dfb\u52a0\u5206\u7c7b",
  addProduct: "\u6dfb\u52a0\u5546\u54c1",
  onlineOrders: "\u7ebf\u4e0a\u8ba2\u5355",
  offlineCashier: "\u6536\u94f6\u4e2d\u5fc3",
  todayOnlineOrders: "\u4eca\u65e5\u7ebf\u4e0a\u8ba2\u5355\u91d1\u989d",
  todayOfflineSales: "\u4eca\u65e5\u7ebf\u4e0b\u5df2\u6536\u6b3e",
  cashReceived: "\u73b0\u91d1\u6536\u5165",
  transferReceived: "GCash / \u94f6\u884c\u8f6c\u8d26",
  pendingOnlineOrders: "\u5f85\u786e\u8ba4\u7ebf\u4e0a\u8ba2\u5355",
  waitingCashier: "\u7b49\u5f85\u6536\u94f6",
  customers: "\u5ba2\u6237",
  activeCustomers: "\u6d3b\u8dc3\u5ba2\u6237",
  activeProducts: "\u4e0a\u67b6\u5546\u54c1",
  hiddenProducts: "\u9690\u85cf\u5546\u54c1",
  lowStockProducts: "\u4f4e\u5e93\u5b58 / \u7f3a\u8d27",
  recentOrders: "\u6700\u8fd1\u7ebf\u4e0a\u8ba2\u5355",
  noOrders: "\u6682\u65e0\u7ebf\u4e0a\u8ba2\u5355\u3002",
  customer: "\u5ba2\u6237",
  status: "\u72b6\u6001",
  total: "\u91d1\u989d",
  dataNote: "\u8fd9\u91cc\u7684\u7ebf\u4e0b\u9500\u552e\u989d\u53ea\u7edf\u8ba1\u6536\u94f6\u5458\u5df2\u786e\u8ba4\u6536\u6b3e\uff1b\u7ebf\u4e0a\u8ba2\u5355\u91d1\u989d\u662f\u5ba2\u6237\u63d0\u4ea4\u7684\u8ba2\u5355\u91d1\u989d\uff0c\u4ed8\u6b3e\u4ecd\u9700\u4eba\u5de5\u786e\u8ba4\u3002",
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
  const readableZh: Record<string, string> = {
    pending_confirmation: "\u5f85\u786e\u8ba4",
    waiting_deposit: "\u7b49\u5f85\u5b9a\u91d1",
    deposit_paid: "\u5df2\u4ed8\u5b9a\u91d1",
    sourcing_items: "\u5907\u8d27\u4e2d",
    ready_for_pickup: "\u53ef\u53d6\u8d27",
    completed: "\u5df2\u5b8c\u6210",
    cancelled: "\u5df2\u53d6\u6d88",
  };

  if (language === "zh") {
    return readableZh[status] ?? status;
  }

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
  const text = language === "zh" ? { ...copy.zh, ...readableDashboardZh } : copy.en;

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
