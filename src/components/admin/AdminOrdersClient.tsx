"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import type { TranslationKey } from "@/lib/admin-i18n";
import type { AdminOrderRecord, AdminPaymentRecord } from "@/lib/admin-orders-data";
import { formatPhp } from "@/lib/wholesale-pricing";

type PaymentDraft = {
  paymentMethod: string;
  amount: string;
  referenceNo: string;
  status: string;
  proofImageUrl: string;
};

type LalamoveQuote = {
  quotationId: string;
  expiresAt: string;
  serviceType: string;
  total: number;
  currency: string;
  distanceMeters: number | null;
};

const pageSize = 10;
const orderStatuses = [
  "pending_confirmation",
  "waiting_deposit",
  "deposit_paid",
  "sourcing_items",
  "ready_for_pickup",
  "completed",
  "cancelled",
  "unavailable_refund",
];
const paymentStatuses = ["no_payment", "deposit_submitted", "deposit_verified", "fully_paid", "rejected"];
const receivingMethods = ["pickup", "local_delivery", "courier_shipping", "to_be_arranged"];
const shippingFeePayments = ["freight_collect", "prepaid", "to_be_confirmed", "no_shipping_fee"];

const text = {
  en: {
    searchOrderNo: "Search by Order No",
    searchCustomer: "Search customer name or phone",
    allOrderStatuses: "All order statuses",
    allPaymentStatuses: "All payment statuses",
    allReceivingMethods: "All receiving methods",
    dateRangePlaceholder: "Date range placeholder",
    shippingFeeStatus: "Shipping Fee Status",
    updateShipping: "Update Shipping Fee",
    shippingFeeHint: "Freight collect is paid by receiver and is not added to product total.",
    paymentFormTitle: "Add Payment Record",
    proofImageUrl: "Proof Image URL",
    saveAdminNotes: "Save Admin Notes",
    saved: "Saved.",
    printMock: "Print order mockup opened.",
    confirmCancel: "Cancel this order?",
    noOrders: "No real orders found.",
    noPayments: "No payment records yet.",
    developmentOnly: "Development-only admin route until admin authentication is added.",
  },
  zh: {
    searchOrderNo: "按订单号搜索",
    searchCustomer: "按客户姓名或电话搜索",
    allOrderStatuses: "全部订单状态",
    allPaymentStatuses: "全部付款状态",
    allReceivingMethods: "全部收货方式",
    dateRangePlaceholder: "日期范围占位",
    shippingFeeStatus: "运费状态",
    updateShipping: "更新运费",
    shippingFeeHint: "运费到付由收货人支付，不加入商品总额。",
    paymentFormTitle: "添加付款记录",
    proofImageUrl: "付款凭证图片 URL",
    saveAdminNotes: "保存后台备注",
    saved: "已保存。",
    printMock: "打印订单 mockup 已触发。",
    confirmCancel: "确定取消这个订单？",
    noOrders: "暂无真实订单。",
    noPayments: "暂无付款记录。",
    developmentOnly: "后台登录未完成前，此后台接口仅用于开发。",
  },
};

const statusKeyByValue: Record<string, TranslationKey> = {
  pending_confirmation: "pendingConfirmation",
  waiting_deposit: "waitingDeposit",
  waiting_for_deposit: "waitingDeposit",
  deposit_paid: "depositPaid",
  sourcing_items: "sourcingItems",
  ready_for_pickup: "readyForPickup",
  completed: "completed",
  cancelled: "cancelled",
  unavailable_refund: "unavailableRefund",
  no_payment: "noPayment",
  deposit_submitted: "depositSubmitted",
  deposit_verified: "depositVerified",
  fully_paid: "fullyPaid",
  rejected: "rejected",
  ready_stock: "readyStock",
  for_order: "forOrder",
  low_stock: "lowStock",
  unavailable: "unavailable",
};

const receivingMethodKeyByValue: Record<string, TranslationKey> = {
  pickup: "pickUpAtStore",
  pick_up_at_store: "pickUpAtStore",
  local_delivery: "localDelivery",
  local_delivery_lalamove: "localDelivery",
  courier_shipping: "courierShipping",
  to_be_arranged: "toBeConfirmed",
};

const shippingFeePaymentKeyByValue: Record<string, TranslationKey> = {
  freight_collect: "freightCollect",
  prepaid: "prepaidShipping",
  to_be_confirmed: "toBeConfirmed",
  no_shipping_fee: "pickupNoShippingFee",
  pickup_no_shipping_fee: "pickupNoShippingFee",
};

function labelFor(t: (key: TranslationKey) => string, map: Record<string, TranslationKey>, value: string) {
  return t(map[value] ?? "status");
}

export function AdminOrdersClient({
  initialOrders,
  initialError,
}: {
  initialOrders: AdminOrderRecord[];
  initialError?: string;
}) {
  const { t, language } = useAdminI18n();
  const copy = text[language];
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrderNo, setSelectedOrderNo] = useState(initialOrders[0]?.orderNo ?? "");
  const [orderNoSearch, setOrderNoSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [receivingMethod, setReceivingMethod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState(initialError ?? "");
  const selectedOrder = orders.find((order) => order.orderNo === selectedOrderNo) ?? orders[0] ?? null;

  const filteredOrders = useMemo(() => {
    const orderNeedle = orderNoSearch.trim().toLowerCase();
    const customerNeedle = customerSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const orderMatch = !orderNeedle || order.orderNo.toLowerCase().includes(orderNeedle);
      const customerMatch =
        !customerNeedle ||
        order.customerName.toLowerCase().includes(customerNeedle) ||
        order.customerPhone.toLowerCase().includes(customerNeedle);
      const orderStatusMatch = orderStatus === "all" || order.orderStatus === orderStatus;
      const paymentStatusMatch = paymentStatus === "all" || order.paymentStatus === paymentStatus;
      const receivingMethodMatch = receivingMethod === "all" || order.receivingMethod === receivingMethod;
      const orderTime = order.createdAt ? new Date(order.createdAt).getTime() : 0;
      const fromMatch = dateFrom ? orderTime >= new Date(`${dateFrom}T00:00:00`).getTime() : true;
      const toMatch = dateTo ? orderTime <= new Date(`${dateTo}T23:59:59`).getTime() : true;

      return orderMatch && customerMatch && orderStatusMatch && paymentStatusMatch && receivingMethodMatch && fromMatch && toMatch;
    });
  }, [customerSearch, dateFrom, dateTo, orderNoSearch, orderStatus, orders, paymentStatus, receivingMethod]);

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const visibleOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  const patchOrder = async (orderNo: string, patch: Record<string, unknown>) => {
    setMessage("");
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderNo)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const result = (await response.json().catch(() => ({ ok: false, message: "Update failed." }))) as {
      ok?: boolean;
      message?: string;
      order?: Partial<AdminOrderRecord>;
    };

    if (!response.ok || !result.ok || !result.order) {
      setMessage(result.message ?? "Update failed.");
      return false;
    }

    setOrders((current) => current.map((order) => (order.orderNo === orderNo ? { ...order, ...result.order } : order)));
    setMessage(copy.saved);
    return true;
  };

  const addPaymentRecord = async (orderNo: string, draft: PaymentDraft) => {
    setMessage("");
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderNo)}/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    const result = (await response.json().catch(() => ({ ok: false, message: "Payment record failed." }))) as {
      ok?: boolean;
      message?: string;
      payment?: AdminPaymentRecord;
    };

    if (!response.ok || !result.ok || !result.payment) {
      setMessage(result.message ?? "Payment record failed.");
      return false;
    }

    setOrders((current) =>
      current.map((order) =>
        order.orderNo === orderNo ? { ...order, payments: [result.payment as AdminPaymentRecord, ...order.payments] } : order,
      ),
    );
    setMessage(copy.saved);
    return true;
  };

  return (
    <>
      <div className="print:hidden">
        <AdminPageTitle titleKey="orders" caption={copy.developmentOnly} />
        {message ? <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-700">{message}</div> : null}

        <div className="mb-4 rounded-md border border-orange-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <StatusPill tone="orange">{t("shippingFeeSeparate")}</StatusPill>
            <StatusPill tone="neutral">{t("freightCollect")}</StatusPill>
            <StatusPill tone="neutral">{t("noAutomaticPricing")}</StatusPill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <input
              value={orderNoSearch}
              onChange={(event) => {
                setOrderNoSearch(event.target.value);
                setPage(1);
              }}
              placeholder={copy.searchOrderNo}
              className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
            />
            <input
              value={customerSearch}
              onChange={(event) => {
                setCustomerSearch(event.target.value);
                setPage(1);
              }}
              placeholder={copy.searchCustomer}
              className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
            />
            <FilterSelect value={orderStatus} onChange={setOrderStatus} allLabel={copy.allOrderStatuses} values={orderStatuses} map={statusKeyByValue} />
            <FilterSelect value={paymentStatus} onChange={setPaymentStatus} allLabel={copy.allPaymentStatuses} values={paymentStatuses} map={statusKeyByValue} />
            <FilterSelect value={receivingMethod} onChange={setReceivingMethod} allLabel={copy.allReceivingMethods} values={receivingMethods} map={receivingMethodKeyByValue} />
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
              aria-label="Date from"
              className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold text-zinc-700 outline-none focus:border-orange-500"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
              aria-label="Date to"
              className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold text-zinc-700 outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <TableShell>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1240px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">{t("orderNo")}</th>
                  <th className="px-4 py-3">{t("customerName")}</th>
                  <th className="px-4 py-3">{t("customerPhone")}</th>
                  <th className="px-4 py-3">{t("productTotal")}</th>
                  <th className="px-4 py-3">{t("orderStatus")}</th>
                  <th className="px-4 py-3">{t("paymentStatus")}</th>
                  <th className="px-4 py-3">{t("receivingMethod")}</th>
                  <th className="px-4 py-3">{t("shippingFeePayment")}</th>
                  <th className="px-4 py-3">{t("date")}</th>
                  <th className="px-4 py-3">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {visibleOrders.map((order) => (
                  <tr key={order.orderNo} className={selectedOrder?.orderNo === order.orderNo ? "bg-orange-50/50" : "bg-white"}>
                    <td className="px-4 py-4 font-black text-zinc-950">{order.orderNo}</td>
                    <td className="px-4 py-4 text-zinc-700">{order.customerName}</td>
                    <td className="px-4 py-4 text-zinc-600">{order.customerPhone}</td>
                    <td className="px-4 py-4 font-black text-orange-700">{formatPhp(order.productTotal)}</td>
                    <td className="px-4 py-4"><StatusPill tone="orange">{labelFor(t, statusKeyByValue, order.orderStatus)}</StatusPill></td>
                    <td className="px-4 py-4"><StatusPill tone="green">{labelFor(t, statusKeyByValue, order.paymentStatus)}</StatusPill></td>
                    <td className="px-4 py-4 text-zinc-600">{labelFor(t, receivingMethodKeyByValue, order.receivingMethod)}</td>
                    <td className="px-4 py-4 text-zinc-600">{labelFor(t, shippingFeePaymentKeyByValue, order.shippingFeePayment)}</td>
                    <td className="px-4 py-4 text-zinc-600">{order.createdDate}</td>
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => setSelectedOrderNo(order.orderNo)} className="rounded-md border border-orange-200 px-3 py-2 text-xs font-black text-orange-700">
                        {t("view")}
                      </button>
                    </td>
                  </tr>
                ))}
                {!visibleOrders.length ? (
                  <tr>
                    <td className="px-4 py-6 text-zinc-500" colSpan={10}>{copy.noOrders}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-white px-4 py-3">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`h-9 w-9 rounded-md text-sm font-black ${pageNumber === page ? "bg-[#f65f18] text-white" : "border border-zinc-200 text-zinc-700"}`}
              >
                {pageNumber}
              </button>
            ))}
          </div>
        </TableShell>

        {selectedOrder ? (
          <OrderDetail order={selectedOrder} patchOrder={patchOrder} addPaymentRecord={addPaymentRecord} />
        ) : null}
      </div>

      {selectedOrder ? <PrintOrderTemplate order={selectedOrder} t={t} /> : null}
    </>
  );
}

function FilterSelect({
  value,
  onChange,
  allLabel,
  values,
  map,
}: {
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  values: string[];
  map: Record<string, TranslationKey>;
}) {
  const { t } = useAdminI18n();

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-orange-500"
    >
      <option value="all">{allLabel}</option>
      {values.map((item) => (
        <option key={item} value={item}>
          {labelFor(t, map, item)}
        </option>
      ))}
    </select>
  );
}

function OrderDetail({
  order,
  patchOrder,
  addPaymentRecord,
}: {
  order: AdminOrderRecord;
  patchOrder: (orderNo: string, patch: Record<string, unknown>) => Promise<boolean>;
  addPaymentRecord: (orderNo: string, draft: PaymentDraft) => Promise<boolean>;
}) {
  const { t, language } = useAdminI18n();
  const copy = text[language];
  const [adminNotes, setAdminNotes] = useState(order.adminNotes);
  const [shippingFeeAmount, setShippingFeeAmount] = useState(order.shippingFeeAmount?.toString() ?? "");
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>({
    paymentMethod: "",
    amount: "",
    referenceNo: "",
    status: "pending",
    proofImageUrl: "",
  });

  const savePayment = async () => {
    const ok = await addPaymentRecord(order.orderNo, paymentDraft);

    if (ok) {
      setPaymentDraft({ paymentMethod: "", amount: "", referenceNo: "", status: "pending", proofImageUrl: "" });
    }
  };

  return (
    <section className="mt-5 space-y-5">
      <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">{t("orderSummary")}</p>
            <h2 className="mt-1 text-2xl font-black text-zinc-950">{order.orderNo}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={order.orderStatus}
              onChange={(event) => patchOrder(order.orderNo, { orderStatus: event.target.value })}
              className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-black text-orange-700"
            >
              {orderStatuses.map((status) => (
                <option key={status} value={status}>{labelFor(t, statusKeyByValue, status)}</option>
              ))}
            </select>
            <select
              value={order.paymentStatus}
              onChange={(event) => patchOrder(order.orderNo, { paymentStatus: event.target.value })}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700"
            >
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>{labelFor(t, statusKeyByValue, status)}</option>
              ))}
            </select>
            <button className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-black text-zinc-700" type="button" onClick={() => window.print()}>
              {t("printOrder")}
            </button>
            <button
              className="rounded-md border border-red-200 px-4 py-2 text-sm font-black text-red-700"
              type="button"
              onClick={() => {
                if (window.confirm(copy.confirmCancel)) {
                  void patchOrder(order.orderNo, { orderStatus: "cancelled" });
                }
              }}
            >
              {t("cancelOrder")}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Info label={t("createdDate")} value={order.createdDate} />
          <Info label={t("productTotal")} value={formatPhp(order.productTotal)} emphasis />
          <Info label={t("shippingFeePayment")} value={labelFor(t, shippingFeePaymentKeyByValue, order.shippingFeePayment)} />
          <Info label={t("shippingFeeAmount")} value={order.shippingFeeAmount === null ? "0" : formatPhp(order.shippingFeeAmount)} />
          <Info label={copy.shippingFeeStatus} value={order.shippingFeeStatus} />
          <Info label={t("amountToConfirm")} value={formatPhp(order.amountToConfirm)} emphasis />
          <Info label={t("orderStatus")} value={labelFor(t, statusKeyByValue, order.orderStatus)} />
          <Info label={t("paymentStatus")} value={labelFor(t, statusKeyByValue, order.paymentStatus)} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title={t("customerAccountInfo")}>
          <InfoGrid rows={[
            [t("customerName"), order.customerName],
            [t("phoneNumber"), order.customerPhone],
            [t("facebookMessenger"), order.facebookMessenger],
            [t("location"), order.location],
            [t("businessType"), order.businessType],
          ]} />
        </Panel>
        <Panel title={t("receiverInfo")}>
          <InfoGrid rows={[
            [t("receiverName"), order.receiverName],
            [t("receiverPhone"), order.receiverPhone],
            [t("receivingMethod"), labelFor(t, receivingMethodKeyByValue, order.receivingMethod)],
            [t("completeAddress"), order.completeAddress],
            [t("shippingFeePayment"), labelFor(t, shippingFeePaymentKeyByValue, order.shippingFeePayment)],
            [t("orderNotes"), order.orderNotes],
          ]} />
        </Panel>
      </div>

      <LalamovePanel order={order} patchOrder={patchOrder} />

      <Panel title={copy.updateShipping}>
        <div className="grid gap-3 md:grid-cols-[240px_200px_auto]">
          <select
            value={order.shippingFeePayment}
            onChange={(event) => patchOrder(order.orderNo, { shippingFeePayment: event.target.value })}
            className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-orange-500"
          >
            {shippingFeePayments.map((option) => (
              <option key={option} value={option}>{labelFor(t, shippingFeePaymentKeyByValue, option)}</option>
            ))}
          </select>
          <input
            value={shippingFeeAmount}
            onChange={(event) => setShippingFeeAmount(event.target.value)}
            placeholder={t("shippingFeeAmount")}
            className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
          />
          <button
            type="button"
            onClick={() => patchOrder(order.orderNo, { shippingFeeAmount: shippingFeeAmount ? Number(shippingFeeAmount) : null })}
            className="h-11 rounded-md bg-[#f65f18] px-4 text-sm font-black text-white"
          >
            {t("save")}
          </button>
        </div>
        <p className="mt-3 text-xs font-bold text-orange-700">{copy.shippingFeeHint}</p>
      </Panel>

      <Panel title={t("productItems")}>
        <div className="mb-3 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
          {t("supplierNotesAdminOnly")}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t("productImage")}</th>
                <th className="px-4 py-3">{t("sku")}</th>
                <th className="px-4 py-3">{t("productName")}</th>
                <th className="px-4 py-3">{t("quantity")}</th>
                <th className="px-4 py-3">{t("unitPriceSnapshot")}</th>
                <th className="px-4 py-3">{t("subtotal")}</th>
                <th className="px-4 py-3">{t("stockStatus")}</th>
                <th className="px-4 py-3">{t("supplierNotesSnapshot")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="h-14 w-14 rounded-md bg-orange-50 p-1">
                      <Image src={item.image} alt={item.name} width={56} height={56} className="h-full w-full object-contain" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-black text-zinc-950">
                    {item.variantSku || item.sku}
                    {item.variantSku ? <span className="mt-1 block text-xs font-bold text-zinc-500">Product SKU: {item.sku}</span> : null}
                  </td>
                  <td className="px-4 py-3 font-bold text-zinc-800">
                    {item.name}
                    {item.variantName ? <span className="mt-1 block text-xs font-black text-orange-700">Variant: {item.variantName}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-zinc-600">{formatPhp(item.unitPrice)}</td>
                  <td className="px-4 py-3 font-black text-orange-700">{formatPhp(item.subtotal)}</td>
                  <td className="px-4 py-3"><StatusPill tone="orange">{labelFor(t, statusKeyByValue, item.stockStatus)}</StatusPill></td>
                  <td className="px-4 py-3 text-zinc-600">{item.supplierNotesSnapshot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Panel title={t("paymentRecords")}>
          <div className="mb-4 grid gap-3 md:grid-cols-5">
            <input className="h-10 rounded-md border border-zinc-200 px-3 text-sm" placeholder={t("paymentMethod")} value={paymentDraft.paymentMethod} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, paymentMethod: event.target.value }))} />
            <input className="h-10 rounded-md border border-zinc-200 px-3 text-sm" placeholder={t("amount")} value={paymentDraft.amount} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, amount: event.target.value }))} />
            <input className="h-10 rounded-md border border-zinc-200 px-3 text-sm" placeholder={t("referenceNo")} value={paymentDraft.referenceNo} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, referenceNo: event.target.value }))} />
            <select className="h-10 rounded-md border border-zinc-200 px-3 text-sm" value={paymentDraft.status} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, status: event.target.value }))}>
              {["pending", "verified", "rejected"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button type="button" onClick={savePayment} className="h-10 rounded-md bg-[#f65f18] px-4 text-sm font-black text-white">{t("addPaymentRecord")}</button>
          </div>
          <input className="mb-4 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm" placeholder={copy.proofImageUrl} value={paymentDraft.proofImageUrl} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, proofImageUrl: event.target.value }))} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">{t("paymentMethod")}</th>
                  <th className="px-4 py-3">{t("amount")}</th>
                  <th className="px-4 py-3">{t("referenceNo")}</th>
                  <th className="px-4 py-3">{t("status")}</th>
                  <th className="px-4 py-3">{t("date")}</th>
                  <th className="px-4 py-3">{t("proofImage")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {order.payments.length ? order.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-zinc-600">{payment.method}</td>
                    <td className="px-4 py-3 font-black text-orange-700">{formatPhp(payment.amount)}</td>
                    <td className="px-4 py-3 text-zinc-600">{payment.referenceNo}</td>
                    <td className="px-4 py-3"><StatusPill tone="green">{payment.status}</StatusPill></td>
                    <td className="px-4 py-3 text-zinc-600">{payment.date}</td>
                    <td className="px-4 py-3"><div className="h-12 w-16 rounded bg-zinc-100 ring-1 ring-zinc-200" /></td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-4 py-5 text-zinc-500" colSpan={6}>{copy.noPayments}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title={t("adminNotes")}>
          <textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} className="min-h-40 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700" />
          <button type="button" onClick={() => patchOrder(order.orderNo, { adminNotes })} className="mt-3 h-10 rounded-md bg-[#f65f18] px-4 text-sm font-black text-white">
            {copy.saveAdminNotes}
          </button>
        </Panel>
      </div>
    </section>
  );
}

function LalamovePanel({
  order,
  patchOrder,
}: {
  order: AdminOrderRecord;
  patchOrder: (orderNo: string, patch: Record<string, unknown>) => Promise<boolean>;
}) {
  const { language } = useAdminI18n();
  const labels =
    language === "zh"
      ? {
          title: "Lalamove 运费报价",
          hint: "这里只查询配送费用，不会自动叫车。现在先从 Google Maps 复制客户地址经纬度。",
          serviceType: "车型",
          dropoffLat: "目的地纬度",
          dropoffLng: "目的地经度",
          dropoffAddress: "目的地地址",
          getQuote: "查询 Lalamove 报价",
          checking: "查询中...",
          apply: "填入预付运费",
          failed: "Lalamove 报价失败。",
          received: "已取得 Lalamove 报价，请确认后再填入订单。",
          applied: "报价已填入为预付运费。",
          total: "总额",
          service: "车型",
          distance: "距离",
          expires: "有效期",
        }
      : {
          title: "Lalamove Delivery Quote",
          hint: "This only checks a delivery fee. It does not book a driver. Paste drop-off coordinates from Google Maps for now.",
          serviceType: "Service type",
          dropoffLat: "Drop-off latitude",
          dropoffLng: "Drop-off longitude",
          dropoffAddress: "Drop-off address",
          getQuote: "Get Lalamove Quote",
          checking: "Checking...",
          apply: "Apply as Prepaid Shipping",
          failed: "Lalamove quote failed.",
          received: "Lalamove quotation received. Review before applying to the order.",
          applied: "Quote applied as prepaid shipping fee.",
          total: "Total",
          service: "Service",
          distance: "Distance",
          expires: "Expires",
        };
  const [serviceType, setServiceType] = useState("MOTORCYCLE");
  const [dropoffLat, setDropoffLat] = useState("");
  const [dropoffLng, setDropoffLng] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState(order.completeAddress);
  const [quote, setQuote] = useState<LalamoveQuote | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const getQuote = async () => {
    setLoading(true);
    setMessage("");
    setQuote(null);

    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.orderNo)}/lalamove/quote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceType,
          dropoffLat,
          dropoffLng,
          dropoffAddress,
        }),
      });
      const result = (await response.json().catch(() => ({ ok: false, message: labels.failed }))) as {
        ok?: boolean;
        message?: string;
        quote?: LalamoveQuote;
      };

      if (!response.ok || !result.ok || !result.quote) {
        setMessage(result.message ?? labels.failed);
        return;
      }

      setQuote(result.quote);
      setMessage(labels.received);
    } finally {
      setLoading(false);
    }
  };

  const applyQuote = async () => {
    if (!quote) {
      return;
    }

    const ok = await patchOrder(order.orderNo, {
      shippingFeePayment: "prepaid",
      shippingFeeAmount: quote.total,
    });

    if (ok) {
      setMessage(labels.applied);
    }
  };

  return (
    <Panel title={labels.title}>
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
        {labels.hint}
      </div>
      <div className="grid gap-3 lg:grid-cols-[180px_1fr_1fr]">
        <label className="grid gap-1 text-sm font-bold text-zinc-700">
          {labels.serviceType}
          <select
            value={serviceType}
            onChange={(event) => setServiceType(event.target.value)}
            className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-orange-500"
          >
            {["MOTORCYCLE", "SEDAN", "MPV", "VAN"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold text-zinc-700">
          {labels.dropoffLat}
          <input
            value={dropoffLat}
            onChange={(event) => setDropoffLat(event.target.value)}
            placeholder="14.5995"
            className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-zinc-700">
          {labels.dropoffLng}
          <input
            value={dropoffLng}
            onChange={(event) => setDropoffLng(event.target.value)}
            placeholder="120.9842"
            className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
          />
        </label>
      </div>
      <label className="mt-3 grid gap-1 text-sm font-bold text-zinc-700">
        {labels.dropoffAddress}
        <textarea
          value={dropoffAddress}
          onChange={(event) => setDropoffAddress(event.target.value)}
          className="min-h-20 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
        />
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={getQuote}
          disabled={loading}
          className="h-11 rounded-md bg-[#f65f18] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {loading ? labels.checking : labels.getQuote}
        </button>
        {quote ? (
          <button
            type="button"
            onClick={applyQuote}
            className="h-11 rounded-md border border-orange-200 bg-orange-50 px-5 text-sm font-black text-orange-700"
          >
            {labels.apply}
          </button>
        ) : null}
      </div>
      {message ? <p className="mt-3 text-sm font-bold text-orange-700">{message}</p> : null}
      {quote ? (
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Info label={labels.total} value={`${quote.currency} ${quote.total.toFixed(2)}`} emphasis />
          <Info label={labels.service} value={quote.serviceType} />
          <Info label={labels.distance} value={quote.distanceMeters === null ? "-" : `${(quote.distanceMeters / 1000).toFixed(2)} km`} />
          <Info label={labels.expires} value={quote.expiresAt || "-"} />
        </div>
      ) : null}
    </Panel>
  );
}

function PrintOrderTemplate({ order, t }: { order: AdminOrderRecord; t: (key: TranslationKey) => string }) {
  const shippingFee =
    order.shippingFeePayment === "freight_collect"
      ? "Freight Collect / Paid by Receiver"
      : order.shippingFeeAmount === null
        ? labelFor(t, shippingFeePaymentKeyByValue, order.shippingFeePayment)
        : formatPhp(order.shippingFeeAmount);

  return (
    <section className="hidden bg-white text-zinc-950 print:block">
      <style>{`
        @media print {
          @page {
            size: 105mm 148mm;
            margin: 4mm;
          }

          html,
          body {
            width: 105mm;
            min-height: 148mm;
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .a6-order-sheet {
            width: 97mm;
            max-width: 97mm;
            min-height: 140mm;
            margin: 0;
            font-family: Arial, sans-serif;
            font-size: 9px;
            line-height: 1.25;
            color: #111827;
          }

          .a6-products {
            page-break-inside: avoid;
          }
        }
      `}</style>
      <div className="a6-order-sheet">
        <div className="flex items-start justify-between gap-2 border-b border-zinc-950 pb-1.5">
          <div className="min-w-0">
            <h1 className="text-[13px] font-black uppercase leading-4">Luis One Supply Hub</h1>
            <p className="text-[8px] font-bold uppercase tracking-wide text-zinc-600">Wholesale Order Slip</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black">{order.orderNo}</p>
            <p className="text-[8px] font-bold text-zinc-600">{order.createdDate}</p>
          </div>
        </div>

        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <A6Box title="Customer">
            <A6Row label="Name" value={order.customerName} />
            <A6Row label="Phone" value={order.customerPhone} />
            <A6Row label="FB" value={order.facebookMessenger || "-"} />
          </A6Box>
          <A6Box title="Receiver">
            <A6Row label="Name" value={order.receiverName} />
            <A6Row label="Phone" value={order.receiverPhone} />
            <A6Row label="Method" value={labelFor(t, receivingMethodKeyByValue, order.receivingMethod)} />
          </A6Box>
        </div>

        <A6Box title="Address / Notes" className="mt-1.5">
          <p className="break-words font-bold">{order.completeAddress || "-"}</p>
          {order.orderNotes ? <p className="mt-0.5 break-words text-zinc-600">Note: {order.orderNotes}</p> : null}
        </A6Box>

        <div className="a6-products mt-1.5 overflow-hidden border border-zinc-400">
          <table className="w-full table-fixed text-left text-[8px]">
            <thead className="bg-zinc-100 font-black uppercase text-zinc-700">
              <tr>
                <th className="w-[22mm] border-r border-zinc-400 px-1 py-1">SKU</th>
                <th className="border-r border-zinc-400 px-1 py-1">Item</th>
                <th className="w-[9mm] border-r border-zinc-400 px-1 py-1 text-center">Qty</th>
                <th className="w-[18mm] px-1 py-1 text-right">Sub</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-zinc-300">
                  <td className="break-words border-r border-zinc-300 px-1 py-1 font-bold">{item.variantSku || item.sku}</td>
                  <td className="border-r border-zinc-300 px-1 py-1">
                    <span className="line-clamp-2 font-bold">{item.name}</span>
                    {item.variantName ? <span className="block break-words text-[7px] text-zinc-600">Var: {item.variantName}</span> : null}
                    <span className="block text-[7px] text-zinc-500">{formatPhp(item.unitPrice)} each</span>
                  </td>
                  <td className="border-r border-zinc-300 px-1 py-1 text-center font-black">{item.quantity}</td>
                  <td className="px-1 py-1 text-right font-black">{formatPhp(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-1.5 grid grid-cols-[1fr_37mm] gap-1.5">
          <A6Box title="Handling">
            <p>Manual confirmation required.</p>
            <p>Deposit may be required.</p>
            <p>Freight collect is not added to product total.</p>
          </A6Box>
          <A6Box title="Total">
            <A6Total label="Product" value={formatPhp(order.productTotal)} />
            <A6Total label="Shipping" value={shippingFee} />
            <A6Total label="Payment" value={labelFor(t, statusKeyByValue, order.paymentStatus)} />
            <div className="mt-1 border-t border-zinc-300 pt-1">
              <A6Total label="Confirm" value={formatPhp(order.amountToConfirm)} strong />
            </div>
          </A6Box>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4 text-[8px] font-bold">
          <div>
            <div className="h-6 border-b border-zinc-500" />
            <p className="mt-1">Prepared By</p>
          </div>
          <div>
            <div className="h-6 border-b border-zinc-500" />
            <p className="mt-1">Receiver Sign</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function A6Box({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-sm border border-zinc-300 p-1.5 ${className}`}>
      <h2 className="mb-1 text-[8px] font-black uppercase tracking-wide text-zinc-500">{title}</h2>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function A6Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[12mm_1fr] gap-1 text-[8px]">
      <span className="font-bold text-zinc-500">{label}</span>
      <span className="break-words font-semibold text-zinc-900">{value || "-"}</span>
    </div>
  );
}

function A6Total({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-1 py-0.5 text-[8px] ${strong ? "font-black" : "font-bold"}`}>
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-black text-zinc-950">{title}</h3>
      {children}
    </section>
  );
}

function Info({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-md bg-zinc-50 p-4 ring-1 ring-zinc-100">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className={`mt-2 font-black ${emphasis ? "text-xl text-orange-700" : "text-zinc-950"}`}>{value}</p>
    </div>
  );
}

function InfoGrid({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-2 rounded-md bg-zinc-50 p-3 text-sm sm:grid-cols-[180px_1fr]">
          <span className="font-bold text-zinc-500">{label}</span>
          <span className="font-semibold text-zinc-800">{value}</span>
        </div>
      ))}
    </div>
  );
}
