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
    reports: "Reports",
    bossFocus: "Boss Focus",
    todayCollected: "Today Collected",
    todaySales: "Today Submitted Sales",
    monthCollected: "Month Collected",
    monthSales: "Month Submitted Sales",
    actionQueue: "Action Queue",
    needCashier: "Offline slips waiting cashier",
    needOnlineFollowUp: "Online orders need follow-up",
    employeeRanking: "Employee Monthly Ranking",
    salesperson: "Salesperson",
    paidTotal: "Paid Total",
    submittedTotal: "Submitted Total",
    slips: "Slips",
    cashDrawer: "Cash Drawer",
    gcashToday: "GCash Today",
    bankToday: "Bank Today",
    otherToday: "Other Payment Today",
    viewOrders: "View Orders",
    viewCashier: "Open Cashier",
    viewReports: "View Reports",
    noEmployees: "No employee sales records yet.",
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
    businessHealth: "Business Health",
    actionRequired: "Action Required",
    ready: "Ready",
    openIssues: "Open Issues",
    stockRisk: "Low / unavailable items",
    hiddenCatalog: "Hidden catalog items",
    viewProducts: "View Products",
    dailyChecklist: "Daily Operating Checklist",
    checklistOnline: "Confirm online orders before promising stock, pickup, or delivery.",
    checklistCashier: "Cashier confirms payment before a sale becomes paid.",
    checklistInventory: "Low or unavailable products should be restocked or switched to Messenger inquiry.",
    checklistStaff: "Review employee sales and audit logs before closing the day.",
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
  reports: "\u62a5\u8868",
  bossFocus: "\u8001\u677f\u91cd\u70b9",
  todayCollected: "\u4eca\u65e5\u5df2\u6536\u6b3e",
  todaySales: "\u4eca\u65e5\u63d0\u4ea4\u9500\u552e",
  monthCollected: "\u672c\u6708\u5df2\u6536\u6b3e",
  monthSales: "\u672c\u6708\u63d0\u4ea4\u9500\u552e",
  actionQueue: "\u5f85\u5904\u7406",
  needCashier: "\u7ebf\u4e0b\u5f85\u6536\u94f6\u5355",
  needOnlineFollowUp: "\u7ebf\u4e0a\u5f85\u8ddf\u8fdb\u8ba2\u5355",
  employeeRanking: "\u5458\u5de5\u672c\u6708\u9500\u552e\u6392\u884c",
  salesperson: "\u9500\u552e\u5458",
  paidTotal: "\u5df2\u6536\u6b3e",
  submittedTotal: "\u63d0\u4ea4\u9500\u552e",
  slips: "\u5f20\u5355",
  cashDrawer: "\u94b1\u7bb1\u73b0\u91d1",
  gcashToday: "\u4eca\u65e5 GCash",
  bankToday: "\u4eca\u65e5\u94f6\u884c\u8f6c\u8d26",
  otherToday: "\u4eca\u65e5\u5176\u4ed6\u6536\u6b3e",
  viewOrders: "\u67e5\u770b\u8ba2\u5355",
  viewCashier: "\u6253\u5f00\u6536\u94f6",
  viewReports: "\u67e5\u770b\u62a5\u8868",
  noEmployees: "\u6682\u65e0\u5458\u5de5\u9500\u552e\u8bb0\u5f55\u3002",
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
  businessHealth: "\u7ecf\u8425\u5065\u5eb7\u72b6\u6001",
  actionRequired: "\u9700\u8981\u5904\u7406",
  ready: "\u6b63\u5e38",
  openIssues: "\u5f85\u5904\u7406\u9879",
  stockRisk: "\u4f4e\u5e93\u5b58 / \u7f3a\u8d27\u5546\u54c1",
  hiddenCatalog: "\u9690\u85cf\u5546\u54c1",
  viewProducts: "\u67e5\u770b\u5546\u54c1",
  dailyChecklist: "\u6bcf\u65e5\u8425\u4e1a\u68c0\u67e5",
  checklistOnline: "\u5148\u786e\u8ba4\u7ebf\u4e0a\u8ba2\u5355\uff0c\u518d\u627f\u8bfa\u5e93\u5b58\u3001\u53d6\u8d27\u6216\u914d\u9001\u3002",
  checklistCashier: "\u9500\u552e\u5355\u5fc5\u987b\u7531\u6536\u94f6\u5458\u786e\u8ba4\u6536\u6b3e\u540e\uff0c\u624d\u7b97\u5df2\u6536\u6b3e\u3002",
  checklistInventory: "\u4f4e\u5e93\u5b58\u6216\u7f3a\u8d27\u5546\u54c1\uff0c\u8981\u53ca\u65f6\u8865\u8d27\u6216\u6539\u6210 Messenger \u8be2\u95ee\u3002",
  checklistStaff: "\u6bcf\u5929\u5173\u5e97\u524d\u770b\u5458\u5de5\u9500\u552e\u548c\u64cd\u4f5c\u8bb0\u5f55\u3002",
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

function HealthCard({
  href,
  label,
  note,
  status,
  value,
  tone,
}: {
  href: string;
  label: string;
  note: string;
  status: string;
  value: string | number;
  tone: "orange" | "green" | "neutral";
}) {
  const toneClasses = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    neutral: "border-zinc-200 bg-zinc-50 text-zinc-800",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
  }[tone];

  return (
    <Link href={href} className={`block rounded-md border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${toneClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black">{label}</p>
          <p className="mt-1 text-xs font-bold opacity-75">{note}</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black shadow-sm">{status}</span>
      </div>
      <p className="mt-4 text-2xl font-black">{value}</p>
    </Link>
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

  const labels: Record<string, string> = {
    pending_confirmation: "Pending Confirmation",
    waiting_deposit: "Waiting Deposit",
    deposit_paid: "Deposit Paid",
    sourcing_items: "Sourcing Items",
    ready_for_pickup: "Ready",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return labels[status] ?? status;
}

export function AdminDashboardClient({ data }: { data: AdminDashboardData }) {
  const { language } = useAdminI18n();
  const text = language === "zh" ? { ...copy.zh, ...readableDashboardZh } : copy.en;
  const openIssueCount = data.pendingOnlineOrders + data.waitingCashierCount + data.lowStockProducts;
  const hasOnlineAction = data.pendingOnlineOrders > 0;
  const hasCashierAction = data.waitingCashierCount > 0;
  const hasStockAction = data.lowStockProducts > 0;

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
          <Link href="/admin/reports" className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700">
            {text.reports}
          </Link>
        </div>
      </div>

      <section className="mb-5 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">{text.bossFocus}</p>
            <h2 className="mt-1 text-xl font-black text-zinc-950">{text.todayCollected}</h2>
          </div>
          <Link href="/admin/reports" className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-black text-white">
            {text.viewReports}
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label={text.todayCollected} value={formatPhp(data.todayPaidTotal)} tone="green" />
          <StatCard label={text.todaySales} value={formatPhp(data.todaySalesTotal)} tone="orange" />
          <StatCard label={text.monthCollected} value={formatPhp(data.monthPaidTotal)} tone="green" />
          <StatCard label={text.monthSales} value={formatPhp(data.monthSalesTotal)} />
        </div>
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black text-zinc-950">{text.actionQueue}</h2>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/orders" className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-black text-orange-700">
                {text.viewOrders}
              </Link>
              <Link href="/admin/cashier" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                {text.viewCashier}
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label={text.needOnlineFollowUp} value={formatPhp(data.todayPendingOnlineTotal)} tone="orange" />
            <StatCard label={text.needCashier} value={formatPhp(data.todayWaitingCashierTotal)} tone="orange" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-orange-50 px-4 py-3 text-sm font-black text-orange-800">
              {text.pendingOnlineOrders}: {data.pendingOnlineOrders}
            </div>
            <div className="rounded-md bg-orange-50 px-4 py-3 text-sm font-black text-orange-800">
              {text.waitingCashier}: {data.waitingCashierCount}
            </div>
          </div>
        </div>
        <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-black text-zinc-950">{text.cashDrawer}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label={text.cashReceived} value={formatPhp(data.offlineCashTodayTotal)} tone="green" />
            <StatCard label={text.gcashToday} value={formatPhp(data.todayGcashTotal)} />
            <StatCard label={text.bankToday} value={formatPhp(data.todayBankTransferTotal)} />
            <StatCard label={text.otherToday} value={formatPhp(data.todayOtherPaymentTotal)} />
          </div>
        </div>
      </section>

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

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">{text.businessHealth}</p>
              <h2 className="mt-1 text-lg font-black text-zinc-950">
                {text.openIssues}: {openIssueCount}
              </h2>
            </div>
            <StatusPill tone={openIssueCount ? "orange" : "green"}>{openIssueCount ? text.actionRequired : text.ready}</StatusPill>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HealthCard
              href="/admin/orders"
              label={text.pendingOnlineOrders}
              note={text.needOnlineFollowUp}
              status={hasOnlineAction ? text.actionRequired : text.ready}
              value={data.pendingOnlineOrders}
              tone={hasOnlineAction ? "orange" : "green"}
            />
            <HealthCard
              href="/admin/cashier"
              label={text.waitingCashier}
              note={text.needCashier}
              status={hasCashierAction ? text.actionRequired : text.ready}
              value={data.waitingCashierCount}
              tone={hasCashierAction ? "orange" : "green"}
            />
            <HealthCard
              href="/admin/products"
              label={text.stockRisk}
              note={text.viewProducts}
              status={hasStockAction ? text.actionRequired : text.ready}
              value={data.lowStockProducts}
              tone={hasStockAction ? "orange" : "green"}
            />
            <HealthCard
              href="/admin/products"
              label={text.hiddenCatalog}
              note={text.viewProducts}
              status={data.hiddenProducts ? text.actionRequired : text.ready}
              value={data.hiddenProducts}
              tone={data.hiddenProducts ? "neutral" : "green"}
            />
          </div>
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{text.dailyChecklist}</p>
          <div className="space-y-3 text-sm font-bold text-zinc-700">
            <p className="rounded-md bg-zinc-50 px-3 py-2">{text.checklistOnline}</p>
            <p className="rounded-md bg-zinc-50 px-3 py-2">{text.checklistCashier}</p>
            <p className="rounded-md bg-zinc-50 px-3 py-2">{text.checklistInventory}</p>
            <p className="rounded-md bg-zinc-50 px-3 py-2">{text.checklistStaff}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-zinc-950">{text.employeeRanking}</h2>
          <StatusPill tone="green">{data.topEmployees.length}</StatusPill>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">{text.salesperson}</th>
                <th className="px-4 py-3">{text.slips}</th>
                <th className="px-4 py-3">{text.submittedTotal}</th>
                <th className="px-4 py-3">{text.paidTotal}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.topEmployees.length ? (
                data.topEmployees.map((employee, index) => (
                  <tr key={`${employee.salesName}-${index}`}>
                    <td className="px-4 py-4 font-black text-zinc-900">{index + 1}</td>
                    <td className="px-4 py-4 font-black text-zinc-900">{employee.salesName}</td>
                    <td className="px-4 py-4 text-zinc-600">{employee.orderCount}</td>
                    <td className="px-4 py-4 font-black text-orange-700">{formatPhp(employee.productTotal)}</td>
                    <td className="px-4 py-4 font-black text-emerald-700">{formatPhp(employee.paidTotal)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-sm font-bold text-zinc-500" colSpan={5}>
                    {text.noEmployees}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

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
