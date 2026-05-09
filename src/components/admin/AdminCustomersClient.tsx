"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import type { AdminCustomerRecord } from "@/lib/admin-customers-data";
import { formatPhp } from "@/lib/wholesale-pricing";

const copy = {
  en: {
    caption: "Real customer records from online registration and offline member sales.",
    search: "Search customer name, phone, Messenger, or location",
    points: "Points",
    lifetimePoints: "Lifetime Points",
    action: "Action",
    viewProfile: "View profile",
    viewPoints: "View points",
    hidePoints: "Hide points",
    pointsHistory: "Points history",
    paidAmount: "Paid amount",
    source: "Source",
    date: "Date",
    note: "Note",
    loadingPoints: "Loading points history...",
    pointsNotReady: "Run the loyalty points migration to show member balances.",
    noPointsHistory: "No points history yet.",
    noCustomers: "No customers found.",
    adjustPoints: "Manual points adjustment",
    adjustmentPoints: "Points (+ add / - deduct)",
    adjustmentNote: "Adjustment note",
    applyAdjustment: "Apply adjustment",
    adjustmentSaved: "Customer points adjusted.",
    saving: "Saving...",
    memberOverview: "Member Overview",
    totalCustomers: "Total customers",
    repeatCustomers: "Repeat buyers",
    noPurchaseCustomers: "No purchase yet",
    pointsOutstanding: "Points outstanding",
    lifetimePointsIssued: "Lifetime points issued",
    loyaltyRule: "Loyalty rule",
    loyaltyRuleBody: "Every PHP 100 paid = 1 point. Points are awarded after cashier or online payment confirmation.",
    linkedSalesRule: "Online and offline sales are linked by customer account. Walk-in sales need a selected customer account to earn points.",
    topCustomer: "Top customer",
    filterAll: "All customers",
    filterHasPoints: "Has points",
    filterRepeat: "Repeat buyers",
    filterNoPurchase: "No purchase",
    filterNoPoints: "No points",
    customerSegment: "Segment",
    vipBuyer: "VIP buyer",
    repeatBuyer: "Repeat buyer",
    firstBuyer: "First buyer",
    prospect: "Prospect",
    loadPointsFailed: "Unable to load points history.",
    adjustPointsFailed: "Unable to adjust customer points.",
  },
  zh: {
    caption: "真实客户资料，包含线上注册客户和线下会员销售记录。",
    search: "搜索客户姓名、电话、Messenger 或地区",
    points: "积分",
    lifetimePoints: "累计积分",
    action: "操作",
    viewPoints: "查看积分",
    hidePoints: "收起积分",
    pointsHistory: "积分流水",
    paidAmount: "付款金额",
    source: "来源",
    date: "日期",
    note: "备注",
    loadingPoints: "正在读取积分流水...",
    pointsNotReady: "请先执行会员积分 migration，之后这里会显示积分余额。",
    noPointsHistory: "暂无积分流水。",
    noCustomers: "暂无客户。",
    adjustPoints: "手动调整积分",
    adjustmentPoints: "积分（+ 增加 / - 扣减）",
    adjustmentNote: "调整备注",
    applyAdjustment: "确认调整",
    adjustmentSaved: "客户积分已调整。",
    saving: "保存中...",
  },
};

const zhCopy = {
  caption: "\u771f\u5b9e\u5ba2\u6237\u8d44\u6599\uff0c\u5305\u542b\u7ebf\u4e0a\u6ce8\u518c\u5ba2\u6237\u548c\u7ebf\u4e0b\u4f1a\u5458\u9500\u552e\u8bb0\u5f55\u3002",
  search: "\u641c\u7d22\u5ba2\u6237\u59d3\u540d\u3001\u7535\u8bdd\u3001Messenger \u6216\u5730\u533a",
  points: "\u79ef\u5206",
  lifetimePoints: "\u7d2f\u8ba1\u79ef\u5206",
  action: "\u64cd\u4f5c",
  viewProfile: "\u67e5\u770b\u6863\u6848",
  viewPoints: "\u67e5\u770b\u79ef\u5206",
  hidePoints: "\u6536\u8d77\u79ef\u5206",
  pointsHistory: "\u79ef\u5206\u6d41\u6c34",
  paidAmount: "\u4ed8\u6b3e\u91d1\u989d",
  source: "\u6765\u6e90",
  date: "\u65e5\u671f",
  note: "\u5907\u6ce8",
  loadingPoints: "\u6b63\u5728\u8bfb\u53d6\u79ef\u5206\u6d41\u6c34...",
  pointsNotReady: "\u8bf7\u5148\u6267\u884c\u4f1a\u5458\u79ef\u5206 migration\uff0c\u4e4b\u540e\u8fd9\u91cc\u4f1a\u663e\u793a\u79ef\u5206\u4f59\u989d\u3002",
  noPointsHistory: "\u6682\u65e0\u79ef\u5206\u6d41\u6c34\u3002",
  noCustomers: "\u6682\u65e0\u5ba2\u6237\u3002",
  adjustPoints: "\u624b\u52a8\u8c03\u6574\u79ef\u5206",
  adjustmentPoints: "\u79ef\u5206\uff08+ \u589e\u52a0 / - \u6263\u51cf\uff09",
  adjustmentNote: "\u8c03\u6574\u5907\u6ce8",
  applyAdjustment: "\u786e\u8ba4\u8c03\u6574",
  adjustmentSaved: "\u5ba2\u6237\u79ef\u5206\u5df2\u8c03\u6574\u3002",
  saving: "\u4fdd\u5b58\u4e2d...",
  memberOverview: "\u4f1a\u5458\u6982\u89c8",
  totalCustomers: "\u5ba2\u6237\u603b\u6570",
  repeatCustomers: "\u590d\u8d2d\u5ba2\u6237",
  noPurchaseCustomers: "\u672a\u6210\u4ea4\u5ba2\u6237",
  pointsOutstanding: "\u672a\u4f7f\u7528\u79ef\u5206",
  lifetimePointsIssued: "\u7d2f\u8ba1\u53d1\u653e\u79ef\u5206",
  loyaltyRule: "\u4f1a\u5458\u79ef\u5206\u89c4\u5219",
  loyaltyRuleBody: "\u6bcf PHP 100 \u5b9e\u6536 = 1 \u79ef\u5206\u3002\u6536\u94f6\u6216\u7ebf\u4e0a\u6536\u6b3e\u786e\u8ba4\u540e\u624d\u53d1\u79ef\u5206\u3002",
  linkedSalesRule: "\u7ebf\u4e0a\u4e0e\u7ebf\u4e0b\u9500\u552e\u90fd\u6309\u5ba2\u6237\u8d26\u53f7\u5173\u8054\u3002\u6563\u5ba2\u5355\u8981\u5148\u9009\u5ba2\u6237\u8d26\u53f7\u624d\u4f1a\u7d2f\u79ef\u5206\u3002",
  topCustomer: "\u6700\u9ad8\u6d88\u8d39\u5ba2\u6237",
  filterAll: "\u5168\u90e8\u5ba2\u6237",
  filterHasPoints: "\u6709\u79ef\u5206",
  filterRepeat: "\u590d\u8d2d\u5ba2\u6237",
  filterNoPurchase: "\u672a\u6210\u4ea4",
  filterNoPoints: "\u65e0\u79ef\u5206",
  customerSegment: "\u5ba2\u6237\u5206\u5c42",
  vipBuyer: "VIP \u5ba2\u6237",
  repeatBuyer: "\u590d\u8d2d\u5ba2\u6237",
  firstBuyer: "\u9996\u6b21\u6210\u4ea4",
  prospect: "\u5f85\u8ddf\u8fdb\u5ba2\u6237",
  loadPointsFailed: "\u65e0\u6cd5\u8f7d\u5165\u79ef\u5206\u6d41\u6c34\u3002",
  adjustPointsFailed: "\u65e0\u6cd5\u8c03\u6574\u5ba2\u6237\u79ef\u5206\u3002",
} satisfies typeof copy.en;

type AdminCustomerLoyaltyTransaction = {
  id: string;
  sourceType: string;
  sourceId: string;
  points: number;
  amount: number;
  note: string;
  createdAt: string;
};

type LoyaltyHistoryState = {
  loading: boolean;
  pointsReady: boolean;
  message: string;
  transactions: AdminCustomerLoyaltyTransaction[];
};

type CustomerFilter = "all" | "has_points" | "repeat" | "no_purchase" | "no_points";

export function AdminCustomersClient({
  initialCustomers,
  initialError,
  pointsReady,
}: {
  initialCustomers: AdminCustomerRecord[];
  initialError?: string;
  pointsReady: boolean;
}) {
  const { t, language } = useAdminI18n();
  const text = language === "zh" ? zhCopy : copy.en;
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [expandedCustomerId, setExpandedCustomerId] = useState("");
  const [loyaltyHistoryByCustomer, setLoyaltyHistoryByCustomer] = useState<Record<string, LoyaltyHistoryState>>({});
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustMessage, setAdjustMessage] = useState("");

  const overview = useMemo(() => {
    const repeatCustomers = customers.filter((customer) => customer.orderCount >= 2).length;
    const noPurchaseCustomers = customers.filter((customer) => customer.orderCount === 0).length;
    const pointsOutstanding = customers.reduce((sum, customer) => sum + (customer.pointsBalance ?? 0), 0);
    const lifetimePointsIssued = customers.reduce((sum, customer) => sum + (customer.lifetimePoints ?? 0), 0);
    const topCustomer = customers.reduce<AdminCustomerRecord | null>((best, customer) => {
      if (!best || customer.totalSpend > best.totalSpend) {
        return customer;
      }

      return best;
    }, null);

    return {
      totalCustomers: customers.length,
      repeatCustomers,
      noPurchaseCustomers,
      pointsOutstanding,
      lifetimePointsIssued,
      topCustomer,
    };
  }, [customers]);

  const visibleCustomers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filteredCustomers = customers.filter((customer) => {
      if (filter === "has_points") {
        return (customer.pointsBalance ?? 0) > 0;
      }

      if (filter === "repeat") {
        return customer.orderCount >= 2;
      }

      if (filter === "no_purchase") {
        return customer.orderCount === 0;
      }

      if (filter === "no_points") {
        return (customer.pointsBalance ?? 0) === 0;
      }

      return true;
    });

    if (!needle) {
      return filteredCustomers;
    }

    return filteredCustomers.filter((customer) =>
      [
        customer.name,
        customer.phone,
        customer.facebookMessenger,
        customer.location,
        customer.businessType,
        customer.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [customers, filter, search]);

  async function togglePointsHistory(customerId: string) {
    setAdjustMessage("");

    if (expandedCustomerId === customerId) {
      setExpandedCustomerId("");
      return;
    }

    setExpandedCustomerId(customerId);

    if (loyaltyHistoryByCustomer[customerId]) {
      return;
    }

    setLoyaltyHistoryByCustomer((current) => ({
      ...current,
      [customerId]: { loading: true, pointsReady, message: "", transactions: [] },
    }));

    try {
      const response = await fetch(`/api/admin/customers/${customerId}/loyalty`);
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        pointsReady?: boolean;
        message?: string;
        transactions?: AdminCustomerLoyaltyTransaction[];
      };

      setLoyaltyHistoryByCustomer((current) => ({
        ...current,
        [customerId]: {
          loading: false,
          pointsReady: Boolean(payload.pointsReady),
          message: payload.message ?? (!response.ok ? text.loadPointsFailed : ""),
          transactions: Array.isArray(payload.transactions) ? payload.transactions : [],
        },
      }));
    } catch {
      setLoyaltyHistoryByCustomer((current) => ({
        ...current,
        [customerId]: { loading: false, pointsReady, message: text.loadPointsFailed, transactions: [] },
      }));
    }
  }

  async function submitPointsAdjustment(customerId: string) {
    setAdjustMessage("");
    setAdjusting(true);

    try {
      const response = await fetch(`/api/admin/customers/${customerId}/loyalty`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          points: Number(adjustPoints),
          note: adjustNote,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        pointsBalance?: number;
        lifetimePoints?: number;
        transaction?: AdminCustomerLoyaltyTransaction;
      };

      if (!response.ok || !payload.ok) {
        setAdjustMessage(payload.message ?? text.adjustPointsFailed);
        return;
      }

      setCustomers((current) =>
        current.map((customer) =>
          customer.id === customerId
            ? {
                ...customer,
                pointsBalance: typeof payload.pointsBalance === "number" ? payload.pointsBalance : customer.pointsBalance,
                lifetimePoints: typeof payload.lifetimePoints === "number" ? payload.lifetimePoints : customer.lifetimePoints,
              }
            : customer,
        ),
      );

      if (payload.transaction) {
        setLoyaltyHistoryByCustomer((current) => {
          const existing = current[customerId] ?? { loading: false, pointsReady: true, message: "", transactions: [] };

          return {
            ...current,
            [customerId]: {
              ...existing,
              loading: false,
              pointsReady: true,
              message: "",
              transactions: [payload.transaction!, ...existing.transactions],
            },
          };
        });
      }

      setAdjustPoints("");
      setAdjustNote("");
      setAdjustMessage(payload.message ?? text.adjustmentSaved);
    } catch {
      setAdjustMessage(text.adjustPointsFailed);
    } finally {
      setAdjusting(false);
    }
  }

  return (
    <>
      <AdminPageTitle titleKey="customers" caption={text.caption} />
      {initialError ? <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-700">{initialError}</div> : null}
      {!pointsReady ? <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">{text.pointsNotReady}</div> : null}

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1.15fr]">
        <CustomerMetricCard label={text.totalCustomers} value={overview.totalCustomers.toLocaleString("en-US")} hint={text.memberOverview} />
        <CustomerMetricCard label={text.repeatCustomers} value={overview.repeatCustomers.toLocaleString("en-US")} hint={text.customerSegment} />
        <CustomerMetricCard label={text.pointsOutstanding} value={overview.pointsOutstanding.toLocaleString("en-US")} hint={text.lifetimePointsIssued + ": " + overview.lifetimePointsIssued.toLocaleString("en-US")} />
        <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-700">{text.loyaltyRule}</p>
          <p className="mt-2 text-sm font-black leading-6 text-zinc-950">{text.loyaltyRuleBody}</p>
          <p className="mt-2 text-xs font-bold leading-5 text-zinc-600">{text.linkedSalesRule}</p>
        </div>
      </div>

      {overview.topCustomer ? (
        <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          {text.topCustomer}: <span className="font-black">{overview.topCustomer.name}</span> / {formatPhp(overview.topCustomer.totalSpend)} / {overview.topCustomer.orderCount.toLocaleString("en-US")} {t("orders")}
        </div>
      ) : null}

      <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={text.search}
          className="h-11 w-full rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { key: "all", label: text.filterAll },
            { key: "has_points", label: text.filterHasPoints },
            { key: "repeat", label: text.filterRepeat },
            { key: "no_purchase", label: text.filterNoPurchase },
            { key: "no_points", label: text.filterNoPoints },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key as CustomerFilter)}
              className={`rounded-md px-3 py-2 text-xs font-black ring-1 ${
                filter === item.key ? "bg-[#f65f18] text-white ring-[#f65f18]" : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <TableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t("name")}</th>
                <th className="px-4 py-3">{t("phone")}</th>
                <th className="px-4 py-3">{t("facebookMessenger")}</th>
                <th className="px-4 py-3">{t("location")}</th>
                <th className="px-4 py-3">{t("businessType")}</th>
                <th className="px-4 py-3">{t("orderCount")}</th>
                <th className="px-4 py-3">{t("totalSpend")}</th>
                <th className="px-4 py-3">{text.customerSegment}</th>
                <th className="px-4 py-3">{text.points}</th>
                <th className="px-4 py-3">{text.lifetimePoints}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{text.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visibleCustomers.map((customer) => {
                const isExpanded = expandedCustomerId === customer.id;
                const loyaltyState = loyaltyHistoryByCustomer[customer.id];

                return (
                  <Fragment key={customer.id}>
                    <tr>
                      <td className="px-4 py-4 font-black text-zinc-950">{customer.name}</td>
                      <td className="px-4 py-4 text-zinc-600">{customer.phone || "-"}</td>
                      <td className="px-4 py-4 text-zinc-600">{customer.facebookMessenger || "-"}</td>
                      <td className="px-4 py-4 text-zinc-600">{customer.location || "-"}</td>
                      <td className="px-4 py-4 text-zinc-600">{customer.businessType || "-"}</td>
                      <td className="px-4 py-4 font-bold text-zinc-700">{customer.orderCount}</td>
                      <td className="px-4 py-4 font-black text-orange-700">{formatPhp(customer.totalSpend)}</td>
                      <td className="px-4 py-4"><StatusPill tone={getCustomerSegment(customer).tone}>{getCustomerSegment(customer).label(text)}</StatusPill></td>
                      <td className="px-4 py-4 font-black text-emerald-700">{customer.pointsBalance === null ? "-" : customer.pointsBalance.toLocaleString("en-US")}</td>
                      <td className="px-4 py-4 font-bold text-zinc-700">{customer.lifetimePoints === null ? "-" : customer.lifetimePoints.toLocaleString("en-US")}</td>
                      <td className="px-4 py-4"><StatusPill tone="green">{customer.status}</StatusPill></td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="rounded-md bg-[#f65f18] px-3 py-2 text-xs font-black text-white hover:bg-orange-700"
                          >
                            {text.viewProfile}
                          </Link>
                          <button
                            type="button"
                            onClick={() => void togglePointsHistory(customer.id)}
                            className="rounded-md border border-orange-200 px-3 py-2 text-xs font-black text-orange-700 hover:bg-orange-50"
                          >
                            {isExpanded ? text.hidePoints : text.viewPoints}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr>
                        <td className="bg-zinc-50 px-4 py-4" colSpan={12}>
                          <div className="rounded-lg border border-zinc-200 bg-white p-4">
                            <h3 className="text-sm font-black text-zinc-950">{text.pointsHistory}</h3>
                            {loyaltyState?.loading ? <p className="mt-3 text-sm font-bold text-zinc-500">{text.loadingPoints}</p> : null}
                            {loyaltyState?.message ? <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">{loyaltyState.message}</p> : null}
                            {!loyaltyState?.loading && loyaltyState?.pointsReady && !loyaltyState.transactions.length ? (
                              <p className="mt-3 text-sm font-bold text-zinc-500">{text.noPointsHistory}</p>
                            ) : null}
                            {loyaltyState?.transactions.length ? (
                              <div className="mt-3 overflow-x-auto">
                                <table className="w-full min-w-[720px] text-left text-xs">
                                  <thead className="bg-zinc-50 uppercase tracking-[0.12em] text-zinc-500">
                                    <tr>
                                      <th className="px-3 py-2">{text.date}</th>
                                      <th className="px-3 py-2">{text.source}</th>
                                      <th className="px-3 py-2">{text.paidAmount}</th>
                                      <th className="px-3 py-2">{text.points}</th>
                                      <th className="px-3 py-2">{text.note}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-100">
                                    {loyaltyState.transactions.map((transaction) => (
                                      <tr key={transaction.id}>
                                        <td className="px-3 py-3 text-zinc-600">{formatDate(transaction.createdAt)}</td>
                                        <td className="px-3 py-3 font-bold text-zinc-700">{formatSourceType(transaction.sourceType, language)}</td>
                                        <td className="px-3 py-3 font-black text-orange-700">{formatPhp(transaction.amount)}</td>
                                        <td className={`px-3 py-3 font-black ${transaction.points >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                                          {transaction.points > 0 ? "+" : ""}{transaction.points.toLocaleString("en-US")}
                                        </td>
                                        <td className="px-3 py-3 text-zinc-600">{transaction.note || "-"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : null}

                            {pointsReady ? (
                              <div className="mt-4 rounded-lg border border-orange-100 bg-orange-50 p-4">
                                <h4 className="text-sm font-black text-zinc-950">{text.adjustPoints}</h4>
                                <div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr_auto]">
                                  <input
                                    type="number"
                                    value={adjustPoints}
                                    onChange={(event) => setAdjustPoints(event.target.value)}
                                    placeholder={text.adjustmentPoints}
                                    className="h-10 rounded-md border border-orange-200 bg-white px-3 text-sm font-bold outline-none focus:border-orange-500"
                                  />
                                  <input
                                    value={adjustNote}
                                    onChange={(event) => setAdjustNote(event.target.value)}
                                    placeholder={text.adjustmentNote}
                                    className="h-10 rounded-md border border-orange-200 bg-white px-3 text-sm font-bold outline-none focus:border-orange-500"
                                  />
                                  <button
                                    type="button"
                                    disabled={adjusting}
                                    onClick={() => void submitPointsAdjustment(customer.id)}
                                    className="h-10 rounded-md bg-[#f65f18] px-4 text-xs font-black text-white disabled:opacity-50"
                                  >
                                    {adjusting ? text.saving : text.applyAdjustment}
                                  </button>
                                </div>
                                {adjustMessage ? <p className="mt-3 text-xs font-bold text-orange-700">{adjustMessage}</p> : null}
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              {!visibleCustomers.length ? (
                <tr>
                  <td className="px-4 py-6 text-zinc-500" colSpan={12}>{text.noCustomers}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TableShell>
    </>
  );
}

function CustomerMetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-zinc-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-zinc-500">{hint}</p>
    </div>
  );
}

function getCustomerSegment(customer: AdminCustomerRecord) {
  if (customer.totalSpend >= 50000 || customer.orderCount >= 5) {
    return { tone: "green" as const, label: (text: typeof copy.en) => text.vipBuyer };
  }

  if (customer.orderCount >= 2) {
    return { tone: "orange" as const, label: (text: typeof copy.en) => text.repeatBuyer };
  }

  if (customer.orderCount === 1) {
    return { tone: "neutral" as const, label: (text: typeof copy.en) => text.firstBuyer };
  }

  return { tone: "neutral" as const, label: (text: typeof copy.en) => text.prospect };
}

function formatDate(value: string) {
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

function formatSourceType(value: string, language: "en" | "zh") {
  if (value === "online_order") {
    return language === "zh" ? "线上订单" : "Online order";
  }

  if (value === "offline_sale" || value === "pos_sale") {
    return language === "zh" ? "线下销售" : "Offline sale";
  }

  return language === "zh" ? "手动调整" : "Manual adjustment";
}
