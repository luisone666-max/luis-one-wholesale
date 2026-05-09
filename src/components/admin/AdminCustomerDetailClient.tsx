"use client";

import Link from "next/link";
import { AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import type { AdminCustomerDetail } from "@/lib/admin-customers-data";
import { formatPhp } from "@/lib/wholesale-pricing";

const copy = {
  en: {
    caption: "Customer profile, member points, online orders, and offline POS sales in one place.",
    backToCustomers: "Back to Customers",
    profile: "Customer Profile",
    memberValue: "Member Value",
    onlineOrders: "Online Orders",
    offlineSales: "Offline POS Sales",
    pointsLedger: "Points Ledger",
    totalPaid: "Total paid",
    onlinePaid: "Online paid",
    offlinePaid: "Offline paid",
    lastActivity: "Last activity",
    pointsBalance: "Points balance",
    lifetimePoints: "Lifetime points",
    contact: "Contact",
    businessType: "Business type",
    location: "Location",
    registeredAt: "Registered at",
    orderNo: "Order No",
    saleNo: "Sale No",
    date: "Date",
    receiver: "Receiver",
    salesperson: "Salesperson",
    paymentMethod: "Payment method",
    amount: "Amount",
    status: "Status",
    paymentStatus: "Payment Status",
    source: "Source",
    points: "Points",
    note: "Note",
    noOnlineOrders: "No online orders for this customer yet.",
    noOfflineSales: "No offline POS sales for this customer yet.",
    noPoints: "No points transactions yet.",
    pointsNotReady: "Run the loyalty points migration to show member points.",
    notFound: "Customer was not found.",
    onlineOfflineHint: "If a walk-in customer wants points, select this customer account on the Sales Desk before sending the sale to cashier.",
  },
};

const zhCopy = {
  caption: "\u628a\u5ba2\u6237\u8d44\u6599\u3001\u4f1a\u5458\u79ef\u5206\u3001\u7ebf\u4e0a\u8ba2\u5355\u548c\u7ebf\u4e0b POS \u9500\u552e\u653e\u5728\u540c\u4e00\u9875\u3002",
  backToCustomers: "\u8fd4\u56de\u5ba2\u6237\u5217\u8868",
  profile: "\u5ba2\u6237\u6863\u6848",
  memberValue: "\u4f1a\u5458\u4ef7\u503c",
  onlineOrders: "\u7ebf\u4e0a\u8ba2\u5355",
  offlineSales: "\u7ebf\u4e0b POS \u9500\u552e",
  pointsLedger: "\u79ef\u5206\u6d41\u6c34",
  totalPaid: "\u603b\u5b9e\u6536",
  onlinePaid: "\u7ebf\u4e0a\u5b9e\u6536",
  offlinePaid: "\u7ebf\u4e0b\u5b9e\u6536",
  lastActivity: "\u6700\u540e\u52a8\u6001",
  pointsBalance: "\u79ef\u5206\u4f59\u989d",
  lifetimePoints: "\u7d2f\u8ba1\u79ef\u5206",
  contact: "\u8054\u7cfb\u65b9\u5f0f",
  businessType: "\u5ba2\u6237\u7c7b\u578b",
  location: "\u5730\u533a",
  registeredAt: "\u6ce8\u518c\u65f6\u95f4",
  orderNo: "\u8ba2\u5355\u53f7",
  saleNo: "\u9500\u552e\u5355\u53f7",
  date: "\u65e5\u671f",
  receiver: "\u6536\u8d27\u4eba",
  salesperson: "\u9500\u552e\u5458",
  paymentMethod: "\u6536\u6b3e\u65b9\u5f0f",
  amount: "\u91d1\u989d",
  status: "\u72b6\u6001",
  paymentStatus: "\u4ed8\u6b3e\u72b6\u6001",
  source: "\u6765\u6e90",
  points: "\u79ef\u5206",
  note: "\u5907\u6ce8",
  noOnlineOrders: "\u8fd9\u4e2a\u5ba2\u6237\u6682\u65e0\u7ebf\u4e0a\u8ba2\u5355\u3002",
  noOfflineSales: "\u8fd9\u4e2a\u5ba2\u6237\u6682\u65e0\u7ebf\u4e0b POS \u9500\u552e\u3002",
  noPoints: "\u6682\u65e0\u79ef\u5206\u6d41\u6c34\u3002",
  pointsNotReady: "\u8bf7\u5148\u6267\u884c\u4f1a\u5458\u79ef\u5206 migration\uff0c\u624d\u80fd\u663e\u793a\u79ef\u5206\u3002",
  notFound: "\u627e\u4e0d\u5230\u8fd9\u4e2a\u5ba2\u6237\u3002",
  onlineOfflineHint: "\u5982\u679c\u7ebf\u4e0b\u6563\u5ba2\u8981\u7d2f\u79ef\u5206\uff0c\u9500\u552e\u5f00\u5355\u65f6\u8981\u5148\u9009\u8fd9\u4e2a\u5ba2\u6237\u8d26\u53f7\u3002",
} satisfies typeof copy.en;

export function AdminCustomerDetailClient({
  detail,
  initialError,
  pointsReady,
}: {
  detail: AdminCustomerDetail | null;
  initialError?: string;
  pointsReady: boolean;
}) {
  const { language } = useAdminI18n();
  const text = language === "zh" ? zhCopy : copy.en;

  if (!detail) {
    return (
      <>
        <AdminPageTitle titleKey="customers" caption={text.caption} />
        <Link href="/admin/customers" className="text-sm font-black text-orange-700 hover:text-orange-800">{text.backToCustomers}</Link>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          {initialError || text.notFound}
        </div>
      </>
    );
  }

  const customer = detail.customer;

  return (
    <>
      <AdminPageTitle titleKey="customers" caption={text.caption} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/admin/customers" className="rounded-md border border-orange-200 px-3 py-2 text-xs font-black text-orange-700 hover:bg-orange-50">
          {text.backToCustomers}
        </Link>
        <StatusPill tone="green">{customer.status}</StatusPill>
      </div>
      {initialError ? <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-700">{initialError}</div> : null}
      {!pointsReady ? <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">{text.pointsNotReady}</div> : null}

      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">{text.profile}</p>
          <h2 className="mt-2 text-2xl font-black text-zinc-950">{customer.name}</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <ProfileRow label={text.contact} value={customer.phone || customer.facebookMessenger || "-"} />
            <ProfileRow label="Messenger" value={customer.facebookMessenger || "-"} />
            <ProfileRow label={text.location} value={customer.location || "-"} />
            <ProfileRow label={text.businessType} value={customer.businessType || "-"} />
            <ProfileRow label={text.registeredAt} value={formatDateTime(customer.createdAt)} />
          </div>
          <p className="mt-4 rounded-md border border-orange-100 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-800">{text.onlineOfflineHint}</p>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">{text.memberValue}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label={text.totalPaid} value={formatPhp(detail.summary.totalPaid)} />
            <Metric label={text.onlinePaid} value={formatPhp(detail.summary.onlinePaidTotal)} />
            <Metric label={text.offlinePaid} value={formatPhp(detail.summary.offlinePaidTotal)} />
            <Metric label={text.pointsBalance} value={customer.pointsBalance === null ? "-" : customer.pointsBalance.toLocaleString("en-US")} />
            <Metric label={text.lifetimePoints} value={customer.lifetimePoints === null ? "-" : customer.lifetimePoints.toLocaleString("en-US")} />
            <Metric label={text.lastActivity} value={formatDateTime(detail.summary.lastActivityAt)} />
          </div>
        </section>
      </div>

      <section className="mb-4">
        <SectionTitle title={text.onlineOrders} count={detail.onlineOrders.length} />
        <TableShell>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">{text.orderNo}</th>
                  <th className="px-4 py-3">{text.date}</th>
                  <th className="px-4 py-3">{text.receiver}</th>
                  <th className="px-4 py-3">{text.amount}</th>
                  <th className="px-4 py-3">{text.status}</th>
                  <th className="px-4 py-3">{text.paymentStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {detail.onlineOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-black text-orange-700">{order.orderNo}</td>
                    <td className="px-4 py-3 text-zinc-600">{formatDateTime(order.createdAt)}</td>
                    <td className="px-4 py-3 text-zinc-700">{order.receiverName || "-"}</td>
                    <td className="px-4 py-3 font-black text-zinc-950">{formatPhp(order.productTotal)}</td>
                    <td className="px-4 py-3"><StatusPill tone="neutral">{formatStatus(order.orderStatus)}</StatusPill></td>
                    <td className="px-4 py-3"><StatusPill tone={order.paymentStatus === "fully_paid" ? "green" : "orange"}>{formatStatus(order.paymentStatus)}</StatusPill></td>
                  </tr>
                ))}
                {!detail.onlineOrders.length ? <tr><td className="px-4 py-5 text-zinc-500" colSpan={6}>{text.noOnlineOrders}</td></tr> : null}
              </tbody>
            </table>
          </div>
        </TableShell>
      </section>

      <section className="mb-4">
        <SectionTitle title={text.offlineSales} count={detail.offlineSales.length} />
        <TableShell>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">{text.saleNo}</th>
                  <th className="px-4 py-3">{text.date}</th>
                  <th className="px-4 py-3">{text.salesperson}</th>
                  <th className="px-4 py-3">{text.paymentMethod}</th>
                  <th className="px-4 py-3">{text.amount}</th>
                  <th className="px-4 py-3">{text.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {detail.offlineSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-4 py-3 font-black text-orange-700">{sale.saleNo}</td>
                    <td className="px-4 py-3 text-zinc-600">{formatDateTime(sale.createdAt)}</td>
                    <td className="px-4 py-3 text-zinc-700">{sale.salespersonName || "-"}</td>
                    <td className="px-4 py-3 font-bold text-zinc-700">{formatStatus(sale.paymentMethod)}</td>
                    <td className="px-4 py-3 font-black text-zinc-950">{formatPhp(sale.totalAmount)}</td>
                    <td className="px-4 py-3"><StatusPill tone={sale.status === "paid" ? "green" : "orange"}>{formatStatus(sale.status)}</StatusPill></td>
                  </tr>
                ))}
                {!detail.offlineSales.length ? <tr><td className="px-4 py-5 text-zinc-500" colSpan={6}>{text.noOfflineSales}</td></tr> : null}
              </tbody>
            </table>
          </div>
        </TableShell>
      </section>

      <section>
        <SectionTitle title={text.pointsLedger} count={detail.loyaltyTransactions.length} />
        <TableShell>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">{text.date}</th>
                  <th className="px-4 py-3">{text.source}</th>
                  <th className="px-4 py-3">{text.amount}</th>
                  <th className="px-4 py-3">{text.points}</th>
                  <th className="px-4 py-3">{text.note}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {detail.loyaltyTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-3 text-zinc-600">{formatDateTime(transaction.createdAt)}</td>
                    <td className="px-4 py-3 font-bold text-zinc-700">{formatStatus(transaction.sourceType)}</td>
                    <td className="px-4 py-3 font-black text-zinc-950">{formatPhp(transaction.amount)}</td>
                    <td className={`px-4 py-3 font-black ${transaction.points >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {transaction.points > 0 ? "+" : ""}{transaction.points.toLocaleString("en-US")}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{transaction.note || "-"}</td>
                  </tr>
                ))}
                {!detail.loyaltyTransactions.length ? <tr><td className="px-4 py-5 text-zinc-500" colSpan={5}>{text.noPoints}</td></tr> : null}
              </tbody>
            </table>
          </div>
        </TableShell>
      </section>
    </>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-2">
      <span className="font-bold text-zinc-500">{label}</span>
      <span className="text-right font-black text-zinc-900">{value}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-100 bg-zinc-50 p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-black text-zinc-950">{value}</p>
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-lg font-black text-zinc-950">{title}</h2>
      <StatusPill tone="neutral">{count.toLocaleString("en-US")}</StatusPill>
    </div>
  );
}

function formatDateTime(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value
    ? value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "-";
}
