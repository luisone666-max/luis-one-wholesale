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
    followUpTitle: "Recommended Follow-up",
    followUpCaption: "Use these prompts to decide what sales or customer service should do next.",
    priority: "Priority",
    vipFollowUpTitle: "Protect this VIP reseller",
    vipFollowUpBody: "Offer a monthly price list, faster Messenger support, and early notice for new stock.",
    firstOrderTitle: "Help this customer place the first order",
    firstOrderBody: "Send product recommendations and explain MOQ, pickup, Lalamove, courier, and payment confirmation.",
    pointsReminderTitle: "Remind customer about points",
    pointsReminderBody: "This customer has points balance. Mention it during the next order to increase repeat purchase.",
    reactivationTitle: "Reactivation needed",
    reactivationBody: "No recent activity. Send new arrivals, promos, or ask what items they are looking for.",
    onlineOnlyTitle: "Connect online buyer to store member record",
    onlineOnlyBody: "If this customer also buys in store, sales should select this customer account on Sales Desk to keep points and history together.",
    missingContactTitle: "Complete customer contact",
    missingContactBody: "Phone or Messenger information is missing. Ask staff to complete it before the next transaction.",
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
  followUpTitle: "\u5efa\u8bae\u8ddf\u8fdb",
  followUpCaption: "\u7528\u8fd9\u4e9b\u63d0\u9192\u5224\u65ad\u9500\u552e\u6216\u5ba2\u670d\u4e0b\u4e00\u6b65\u8981\u505a\u4ec0\u4e48\u3002",
  priority: "\u4f18\u5148\u7ea7",
  vipFollowUpTitle: "\u91cd\u70b9\u7ef4\u62a4 VIP \u7ecf\u9500\u5ba2\u6237",
  vipFollowUpBody: "\u53ef\u4ee5\u63d0\u4f9b\u6708\u5ea6\u62a5\u4ef7\u5355\u3001\u66f4\u5feb\u7684 Messenger \u56de\u590d\u3001\u65b0\u8d27\u4f18\u5148\u901a\u77e5\u3002",
  firstOrderTitle: "\u5e2e\u5ba2\u6237\u5b8c\u6210\u9996\u5355",
  firstOrderBody: "\u4e3b\u52a8\u63a8\u8350\u5546\u54c1\uff0c\u8bf4\u660e MOQ\u3001\u81ea\u63d0\u3001Lalamove\u3001\u5feb\u9012\u548c\u6536\u6b3e\u786e\u8ba4\u6d41\u7a0b\u3002",
  pointsReminderTitle: "\u63d0\u9192\u5ba2\u6237\u6709\u79ef\u5206",
  pointsReminderBody: "\u8fd9\u4e2a\u5ba2\u6237\u8fd8\u6709\u79ef\u5206\u4f59\u989d\uff0c\u4e0b\u6b21\u4e0b\u5355\u65f6\u53ef\u4ee5\u63d0\u9192\uff0c\u63d0\u9ad8\u590d\u8d2d\u3002",
  reactivationTitle: "\u9700\u8981\u5524\u9192\u5ba2\u6237",
  reactivationBody: "\u6700\u8fd1\u6ca1\u6709\u52a8\u6001\u3002\u53ef\u4ee5\u53d1\u65b0\u54c1\u3001\u4f18\u60e0\u6216\u95ee\u5ba2\u6237\u6700\u8fd1\u9700\u8981\u627e\u4ec0\u4e48\u8d27\u3002",
  onlineOnlyTitle: "\u628a\u7ebf\u4e0a\u5ba2\u6237\u4e0e\u95e8\u5e97\u4f1a\u5458\u8bb0\u5f55\u4e32\u8d77\u6765",
  onlineOnlyBody: "\u5982\u679c\u8fd9\u4e2a\u5ba2\u6237\u4e5f\u5230\u5e97\u91cc\u4e70\uff0c\u9500\u552e\u5f00\u5355\u65f6\u8981\u9009\u8fd9\u4e2a\u5ba2\u6237\u8d26\u53f7\uff0c\u8ba9\u79ef\u5206\u548c\u6d88\u8d39\u8bb0\u5f55\u5408\u5728\u4e00\u8d77\u3002",
  missingContactTitle: "\u8865\u5168\u5ba2\u6237\u8054\u7cfb\u65b9\u5f0f",
  missingContactBody: "\u7535\u8bdd\u6216 Messenger \u8d44\u6599\u4e0d\u5b8c\u6574\u3002\u4e0b\u6b21\u4ea4\u6613\u524d\u8bf7\u5458\u5de5\u8865\u5168\u3002",
} satisfies typeof copy.en;

type FollowUpAction = {
  title: string;
  body: string;
  tone: "orange" | "green" | "neutral";
};

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
  const followUpActions = getFollowUpActions(detail, text);

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

      <section className="mb-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">{text.followUpTitle}</p>
            <p className="mt-1 text-sm font-bold text-zinc-500">{text.followUpCaption}</p>
          </div>
          <StatusPill tone="orange">{followUpActions.length.toLocaleString("en-US")}</StatusPill>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {followUpActions.map((action) => (
            <div key={action.title} className="rounded-md border border-zinc-100 bg-zinc-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-zinc-950">{action.title}</h3>
                <StatusPill tone={action.tone}>{text.priority}</StatusPill>
              </div>
              <p className="mt-2 text-xs font-bold leading-5 text-zinc-600">{action.body}</p>
            </div>
          ))}
        </div>
      </section>

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

function getFollowUpActions(detail: AdminCustomerDetail, text: typeof copy.en): FollowUpAction[] {
  const actions: FollowUpAction[] = [];
  const customer = detail.customer;
  const lastActivityTime = detail.summary.lastActivityAt ? Date.parse(detail.summary.lastActivityAt) : 0;
  const inactiveDays = lastActivityTime ? (Date.now() - lastActivityTime) / 86400000 : 999;

  if (detail.summary.totalPaid >= 50000 || customer.orderCount >= 5) {
    actions.push({ title: text.vipFollowUpTitle, body: text.vipFollowUpBody, tone: "green" });
  }

  if (customer.orderCount === 0) {
    actions.push({ title: text.firstOrderTitle, body: text.firstOrderBody, tone: "orange" });
  }

  if ((customer.pointsBalance ?? 0) >= 100) {
    actions.push({ title: text.pointsReminderTitle, body: text.pointsReminderBody, tone: "green" });
  }

  if (customer.orderCount > 0 && inactiveDays >= 30) {
    actions.push({ title: text.reactivationTitle, body: text.reactivationBody, tone: "orange" });
  }

  if (detail.summary.onlineOrderCount > 0 && detail.summary.offlineSaleCount === 0) {
    actions.push({ title: text.onlineOnlyTitle, body: text.onlineOnlyBody, tone: "neutral" });
  }

  if (!customer.phone || !customer.facebookMessenger) {
    actions.push({ title: text.missingContactTitle, body: text.missingContactBody, tone: "neutral" });
  }

  return actions.length ? actions.slice(0, 4) : [{ title: text.reactivationTitle, body: text.reactivationBody, tone: "neutral" }];
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
