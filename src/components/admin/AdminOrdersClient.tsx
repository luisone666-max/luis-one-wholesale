"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import type { TranslationKey } from "@/lib/admin-i18n";
import type { AdminStaffUser } from "@/lib/admin-users-data";
import type { AdminOrderRecord, AdminPaymentRecord } from "@/lib/admin-orders-data";
import type { AdminShipmentRecord } from "@/lib/admin-shipments-data";
import { businessInfo } from "@/lib/business-info";
import { formatLoyaltyPoints } from "@/lib/loyalty-points";
import { formatPhp } from "@/lib/wholesale-pricing";

type PaymentDraft = {
  paymentMethod: string;
  amount: string;
  referenceNo: string;
  status: string;
  proofImageUrl: string;
};

type ShipmentDraft = {
  id: string;
  provider: string;
  providerService: string;
  status: string;
  codStatus: string;
  codAmount: string;
  trackingNo: string;
  waybillNo: string;
  packageWeightGrams: string;
  packageLengthCm: string;
  packageWidthCm: string;
  packageHeightCm: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  notes: string;
};

type JntConfigStatus = {
  configured: boolean;
  liveBookingEnabled: boolean;
  mode: string;
  missingRequired: string[];
  missingRecommended: string[];
};

type LoyaltyResult = {
  ok: boolean;
  points: number;
  awarded: boolean;
  message?: string;
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
const receivingMethods = ["courier_shipping", "pickup", "local_delivery"];
const shippingFeePayments = ["freight_collect", "prepaid", "cod_included", "to_be_confirmed", "no_shipping_fee"];
const shipmentStatuses = ["draft", "ready_to_book", "booked", "in_transit", "delivered", "returning", "returned", "cancelled", "failed"];
const codStatuses = ["not_cod", "pending_collection", "collected", "remitted", "failed", "waived"];

const text = {
  en: {
    searchOrderNo: "Search by Order No",
    searchCustomer: "Search customer name or phone",
    allOrderStatuses: "All order statuses",
    allPaymentStatuses: "All payment statuses",
    allReceivingMethods: "All receiving methods",
    dateRangePlaceholder: "Date range",
    shippingFeeStatus: "Shipping Fee Status",
    updateShipping: "Update Shipping Fee",
    shippingFeeHint: "Receiver-paid delivery fees are not added to product total.",
    paymentFormTitle: "Add Payment Record",
    proofImageUrl: "Proof Image URL",
    saveAdminNotes: "Save Admin Notes",
    saved: "Saved.",
    printA6: "Print A6 Order Slip",
    printWaybill: "Print Waybill",
    printCustomerOrder: "Print Customer Order",
    salesperson: "Salesperson",
    unassignedSales: "Unassigned / Online order",
    confirmCancel: "Cancel this order?",
    noOrders: "No real orders found.",
    noPayments: "No payment records yet.",
    developmentOnly: "Real website order management. Product total, shipping fee, payments, and supplier notes are handled separately.",
    updateFailed: "Update failed.",
    paymentRecordFailed: "Payment record failed.",
    pointsAwarded: "awarded to member.",
    pointsReversed: "reversed from member.",
    pointsNeedManualCheck: "Points need manual check:",
    unknownError: "unknown error",
    shipmentPanelTitle: "J&T Express COD Shipment",
    shipmentDraftHint: "J&T API credentials are pending. Save COD and parcel details here first.",
    saveShipment: "Save J&T Express COD Draft",
    bookShipment: "Book J&T Order",
    printPackageSlip: "Print COD Slip",
    shipmentSaveFailed: "Shipment save failed.",
    shipmentBookFailed: "J&T booking failed.",
    noShipments: "No shipment records yet.",
    codAmount: "COD Amount",
    packageWeight: "Weight (g)",
    packageSize: "Package size (cm)",
    trackingNo: "Tracking No.",
    waybillNo: "Waybill No.",
    shipmentNotes: "Shipment Notes",
    shipmentStatus: "Shipment Status",
    codStatus: "COD Status",
    codIncludedShipping: "J&T Express COD / Included in Total",
    latestShipment: "Latest Shipment",
    shipmentLabels: {
      draft: "Draft",
      ready_to_book: "Ready to book",
      booked: "Booked",
      in_transit: "In transit",
      delivered: "Delivered",
      returning: "Returning",
      returned: "Returned",
      cancelled: "Cancelled",
      failed: "Failed",
    },
    codLabels: {
      not_cod: "Not COD",
      pending_collection: "Pending collection",
      collected: "Collected",
      remitted: "Remitted",
      failed: "Failed",
      waived: "Waived",
    },
  },
  zh: {
    searchOrderNo: "按订单号搜索",
    searchCustomer: "按客户姓名或电话搜索",
    allOrderStatuses: "全部订单状态",
    allPaymentStatuses: "全部付款状态",
    allReceivingMethods: "全部收货方式",
    dateRangePlaceholder: "日期范围",
    shippingFeeStatus: "运费状态",
    updateShipping: "更新运费",
    shippingFeeHint: "到付运费由收货人或骑手收取，不加入商品总额。",
    paymentFormTitle: "添加付款记录",
    proofImageUrl: "付款凭证图片 URL",
    saveAdminNotes: "保存后台备注",
    saved: "已保存。",
    printA6: "打印 A6 订单单据",
    printWaybill: "打印快递面单",
    printCustomerOrder: "打印客户订单",
    salesperson: "销售员工",
    unassignedSales: "未分配 / 线上订单",
    confirmCancel: "确定取消这个订单？",
    noOrders: "暂无真实订单。",
    noPayments: "暂无付款记录。",
    developmentOnly: "真实网站订单管理。商品总额、运费、收款和供应商备注分开处理。",
    updateFailed: "更新失败。",
    paymentRecordFailed: "付款记录保存失败。",
    pointsAwarded: "已给会员增加积分。",
    pointsReversed: "已从会员积分中扣回。",
    pointsNeedManualCheck: "积分需要人工检查：",
    unknownError: "未知错误",
    shipmentPanelTitle: "J&T Express COD 物流",
    shipmentDraftHint: "J&T API 密钥还没接入。先保存 COD 和包裹资料。",
    saveShipment: "保存 J&T Express COD 草稿",
    bookShipment: "预约 J&T 订单",
    printPackageSlip: "打印 COD 包裹单",
    shipmentSaveFailed: "物流记录保存失败。",
    shipmentBookFailed: "J&T 预约失败。",
    noShipments: "暂无物流记录。",
    codAmount: "COD 金额",
    packageWeight: "重量 (g)",
    packageSize: "包裹尺寸 (cm)",
    trackingNo: "追踪号",
    waybillNo: "面单号",
    shipmentNotes: "物流备注",
    shipmentStatus: "物流状态",
    codStatus: "COD 状态",
    codIncludedShipping: "J&T Express COD / 已含运费",
    latestShipment: "最新物流",
    shipmentLabels: {
      draft: "草稿",
      ready_to_book: "待预约",
      booked: "已预约",
      in_transit: "运输中",
      delivered: "已签收",
      returning: "退回中",
      returned: "已退回",
      cancelled: "已取消",
      failed: "失败",
    },
    codLabels: {
      not_cod: "非 COD",
      pending_collection: "待收款",
      collected: "已收款",
      remitted: "已回款",
      failed: "失败",
      waived: "已免收",
    },
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

type OrdersCopy = (typeof text)[keyof typeof text];

function shippingPaymentLabelFor(t: (key: TranslationKey) => string, copy: OrdersCopy, value: string) {
  if (value === "cod_included") {
    return copy.codIncludedShipping;
  }

  return labelFor(t, shippingFeePaymentKeyByValue, value);
}

function draftNumber(value: number | null) {
  return value === null ? "" : String(value);
}

function isJntReceivingMethod(method: string) {
  return method === "courier_shipping";
}

function isLalamoveReceivingMethod(method: string) {
  return method === "local_delivery" || method === "local_delivery_lalamove";
}

function estimateOrderShipmentLogistics(order: AdminOrderRecord) {
  const knownWeightGrams = order.items.reduce((sum, item) => sum + (item.weightGrams ?? 0) * item.quantity, 0);
  const lengthCm = Math.max(0, ...order.items.map((item) => item.lengthCm ?? 0));
  const widthCm = Math.max(0, ...order.items.map((item) => item.widthCm ?? 0));
  const heightCm = Math.max(0, ...order.items.map((item) => item.heightCm ?? 0));
  const isJntOrder = isJntReceivingMethod(order.receivingMethod);
  const flags = new Set<string>();
  const itemNotes: string[] = [];

  for (const item of order.items) {
    if (isJntOrder && !item.codEnabled) {
      flags.add("COD disabled item");
    }

    if (item.fragile || item.shippingCategory === "fragile") {
      flags.add("fragile");
    }

    if (item.containsBattery) {
      flags.add("contains battery");
    }

    if (item.containsLiquid) {
      flags.add("contains liquid");
    }

    if (item.shippingCategory === "oversized") {
      flags.add("oversized");
    }

    if (item.shippingCategory === "restricted") {
      flags.add("restricted");
    }

    if (item.shippingNotes) {
      itemNotes.push(`${item.variantSku || item.sku || item.name}: ${item.shippingNotes}`);
    }
  }

  return {
    packageWeightGrams: knownWeightGrams > 0 ? knownWeightGrams : null,
    packageLengthCm: lengthCm > 0 ? lengthCm : null,
    packageWidthCm: widthCm > 0 ? widthCm : null,
    packageHeightCm: heightCm > 0 ? heightCm : null,
    notes: [...flags, ...itemNotes].join("; "),
  };
}

function getOrderLogisticsIssues(order: AdminOrderRecord) {
  const missingWeight = order.items.filter((item) => !item.weightGrams);
  const missingSize = order.items.filter((item) => !item.lengthCm || !item.widthCm || !item.heightCm);
  const codDisabled = isJntReceivingMethod(order.receivingMethod) ? order.items.filter((item) => !item.codEnabled) : [];
  const specialHandling = order.items.filter(
    (item) => item.fragile || item.containsBattery || item.containsLiquid || item.shippingCategory === "restricted" || item.shippingCategory === "oversized",
  );
  const messages = [
    missingWeight.length ? `${missingWeight.length} item(s) missing weight` : "",
    missingSize.length ? `${missingSize.length} item(s) missing package size` : "",
    codDisabled.length ? `${codDisabled.length} item(s) marked no COD` : "",
    specialHandling.length ? `${specialHandling.length} item(s) need special handling check` : "",
  ].filter(Boolean);

  return {
    missingWeight,
    missingSize,
    codDisabled,
    specialHandling,
    messages,
    ready: messages.length === 0,
  };
}

function createShipmentDraft(order: AdminOrderRecord): ShipmentDraft {
  const shipment = order.shipments[0];
  const estimate = estimateOrderShipmentLogistics(order);
  const isLalamoveOrder = isLalamoveReceivingMethod(order.receivingMethod);
  const customerBooksLalamove = isLalamoveOrder && order.orderNotes.includes("Customer will book");

  return {
    id: shipment?.id ?? "",
    provider: shipment?.provider ?? (isLalamoveOrder ? "lalamove" : "jnt"),
    providerService: shipment?.providerService ?? (isLalamoveOrder ? (customerBooksLalamove ? "customer_books" : "manual_booking") : "cod"),
    status: shipment?.status ?? "draft",
    codStatus: shipment?.codStatus ?? (isLalamoveOrder ? "not_cod" : "pending_collection"),
    codAmount: shipment ? draftNumber(shipment.codAmount) : String(isLalamoveOrder ? order.productTotal : order.amountToConfirm),
    trackingNo: shipment?.trackingNo ?? "",
    waybillNo: shipment?.waybillNo ?? "",
    packageWeightGrams: draftNumber(shipment?.packageWeightGrams ?? estimate.packageWeightGrams),
    packageLengthCm: draftNumber(shipment?.packageLengthCm ?? estimate.packageLengthCm),
    packageWidthCm: draftNumber(shipment?.packageWidthCm ?? estimate.packageWidthCm),
    packageHeightCm: draftNumber(shipment?.packageHeightCm ?? estimate.packageHeightCm),
    receiverName: shipment?.receiverName || order.receiverName,
    receiverPhone: shipment?.receiverPhone || order.receiverPhone,
    receiverAddress: shipment?.receiverAddress || order.completeAddress,
    notes: shipment?.notes ?? estimate.notes,
  };
}

export function AdminOrdersClient({
  initialOrders,
  initialStaffUsers,
  initialError,
}: {
  initialOrders: AdminOrderRecord[];
  initialStaffUsers: AdminStaffUser[];
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
  const [jntConfigStatus, setJntConfigStatus] = useState<JntConfigStatus | null>(null);
  const selectedOrder = orders.find((order) => order.orderNo === selectedOrderNo) ?? orders[0] ?? null;

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/admin/logistics/jnt/status")
      .then((response) => response.json())
      .then((result: { ok?: boolean; status?: JntConfigStatus }) => {
        if (!cancelled && result.ok && result.status) {
          setJntConfigStatus(result.status);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setJntConfigStatus(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderNo)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const result = (await response.json().catch(() => ({ ok: false, message: copy.updateFailed }))) as {
        ok?: boolean;
        message?: string;
        order?: Partial<AdminOrderRecord>;
        loyalty?: LoyaltyResult | null;
      };

      if (!response.ok || !result.ok || !result.order) {
        setMessage(result.message ?? copy.updateFailed);
        return false;
      }

      setOrders((current) => current.map((order) => (order.orderNo === orderNo ? { ...order, ...result.order } : order)));
      const loyaltyMessage = result.loyalty?.awarded
        ? ` ${formatLoyaltyPoints(result.loyalty.points)} ${copy.pointsAwarded}`
        : result.loyalty?.ok && Number(result.loyalty.points ?? 0) < 0
          ? ` ${formatLoyaltyPoints(Math.abs(Number(result.loyalty.points)))} ${copy.pointsReversed}`
        : result.loyalty && !result.loyalty.ok
          ? ` ${copy.pointsNeedManualCheck} ${result.loyalty.message ?? copy.unknownError}`
          : "";
      setMessage(`${copy.saved}${loyaltyMessage}`);
      return true;
    } catch {
      setMessage(copy.updateFailed);
      return false;
    }
  };

  const addPaymentRecord = async (orderNo: string, draft: PaymentDraft) => {
    setMessage("");

    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderNo)}/payments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json().catch(() => ({ ok: false, message: copy.paymentRecordFailed }))) as {
        ok?: boolean;
        message?: string;
        payment?: AdminPaymentRecord;
      };

      if (!response.ok || !result.ok || !result.payment) {
        setMessage(result.message ?? copy.paymentRecordFailed);
        return false;
      }

      setOrders((current) =>
        current.map((order) =>
          order.orderNo === orderNo ? { ...order, payments: [result.payment as AdminPaymentRecord, ...order.payments] } : order,
        ),
      );
      setMessage(copy.saved);
      return true;
    } catch {
      setMessage(copy.paymentRecordFailed);
      return false;
    }
  };

  const saveShipmentRecord = async (orderNo: string, draft: ShipmentDraft) => {
    setMessage("");

    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderNo)}/shipments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json().catch(() => ({ ok: false, message: copy.shipmentSaveFailed }))) as {
        ok?: boolean;
        message?: string;
        shipment?: AdminShipmentRecord;
      };

      if (!response.ok || !result.ok || !result.shipment) {
        setMessage(result.message ?? copy.shipmentSaveFailed);
        return null;
      }

      const shipment = result.shipment as AdminShipmentRecord;
      setOrders((current) =>
        current.map((order) => {
          if (order.orderNo !== orderNo) {
            return order;
          }

          const existingIndex = order.shipments.findIndex((item) => item.id === shipment.id);
          const shipments =
            existingIndex === -1
              ? [shipment, ...order.shipments]
              : order.shipments.map((item) => (item.id === shipment.id ? shipment : item));

          return { ...order, shipments };
        }),
      );
      setMessage(copy.saved);
      return shipment;
    } catch {
      setMessage(copy.shipmentSaveFailed);
      return null;
    }
  };

  const bookShipmentRecord = async (orderNo: string, shipmentId: string) => {
    setMessage("");

    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderNo)}/shipments/book`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shipmentId }),
      });
      const result = (await response.json().catch(() => ({ ok: false, message: copy.shipmentBookFailed }))) as {
        ok?: boolean;
        message?: string;
        shipment?: AdminShipmentRecord;
      };

      if (result.shipment) {
        const shipment = result.shipment as AdminShipmentRecord;
        setOrders((current) =>
          current.map((order) => {
            if (order.orderNo !== orderNo) {
              return order;
            }

            const existing = order.shipments.some((item) => item.id === shipment.id);
            return {
              ...order,
              shipments: existing
                ? order.shipments.map((item) => (item.id === shipment.id ? shipment : item))
                : [shipment, ...order.shipments],
            };
          }),
        );
      }

      if (!response.ok || !result.ok || !result.shipment) {
        setMessage(result.message ?? copy.shipmentBookFailed);
        return null;
      }

      setMessage(result.message ?? copy.saved);
      return result.shipment as AdminShipmentRecord;
    } catch {
      setMessage(copy.shipmentBookFailed);
      return null;
    }
  };

  return (
    <>
      <div className="print:hidden">
        <AdminPageTitle titleKey="orders" caption={copy.developmentOnly} />
        {message ? <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-700">{message}</div> : null}
        {jntConfigStatus ? (
          <div className={`mb-4 rounded-md border p-3 text-sm font-bold ${jntConfigStatus.configured ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
            {jntConfigStatus.configured
              ? `J&T API config is ready (${jntConfigStatus.mode}; live booking ${jntConfigStatus.liveBookingEnabled ? "enabled" : "disabled"}).`
              : `J&T API not configured yet (${jntConfigStatus.mode}). Missing: ${jntConfigStatus.missingRequired.join(", ") || "none"}.`}
          </div>
        ) : null}

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
            <table className="w-full min-w-[1320px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">{t("orderNo")}</th>
                  <th className="px-4 py-3">{t("customerName")}</th>
                  <th className="px-4 py-3">{t("customerPhone")}</th>
                  <th className="px-4 py-3">{t("productTotal")}</th>
                  <th className="px-4 py-3">{copy.salesperson}</th>
                  <th className="px-4 py-3">{t("orderStatus")}</th>
                  <th className="px-4 py-3">{t("paymentStatus")}</th>
                  <th className="px-4 py-3">{t("receivingMethod")}</th>
                  <th className="px-4 py-3">{t("shippingFeePayment")}</th>
                  <th className="px-4 py-3">Logistics</th>
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
                    <td className="px-4 py-4 text-zinc-600">{order.salesName || copy.unassignedSales}</td>
                    <td className="px-4 py-4"><StatusPill tone="orange">{labelFor(t, statusKeyByValue, order.orderStatus)}</StatusPill></td>
                    <td className="px-4 py-4"><StatusPill tone="green">{labelFor(t, statusKeyByValue, order.paymentStatus)}</StatusPill></td>
                    <td className="px-4 py-4 text-zinc-600">{labelFor(t, receivingMethodKeyByValue, order.receivingMethod)}</td>
                    <td className="px-4 py-4 text-zinc-600">{shippingPaymentLabelFor(t, copy, order.shippingFeePayment)}</td>
                    <td className="px-4 py-4"><LogisticsStatusPill order={order} /></td>
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
                    <td className="px-4 py-6 text-zinc-500" colSpan={12}>{copy.noOrders}</td>
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
          <OrderDetail
            key={selectedOrder.orderNo}
            order={selectedOrder}
            staffUsers={initialStaffUsers}
            patchOrder={patchOrder}
            addPaymentRecord={addPaymentRecord}
            saveShipmentRecord={saveShipmentRecord}
            bookShipmentRecord={bookShipmentRecord}
          />
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

function LogisticsStatusPill({ order }: { order: AdminOrderRecord }) {
  const issues = getOrderLogisticsIssues(order);

  return (
    <StatusPill tone={issues.ready ? "green" : "orange"}>
      {issues.ready ? "Ready" : `${issues.messages.length} issue(s)`}
    </StatusPill>
  );
}

function OrderDetail({
  order,
  staffUsers,
  patchOrder,
  addPaymentRecord,
  saveShipmentRecord,
  bookShipmentRecord,
}: {
  order: AdminOrderRecord;
  staffUsers: AdminStaffUser[];
  patchOrder: (orderNo: string, patch: Record<string, unknown>) => Promise<boolean>;
  addPaymentRecord: (orderNo: string, draft: PaymentDraft) => Promise<boolean>;
  saveShipmentRecord: (orderNo: string, draft: ShipmentDraft) => Promise<AdminShipmentRecord | null>;
  bookShipmentRecord: (orderNo: string, shipmentId: string) => Promise<AdminShipmentRecord | null>;
}) {
  const { t, language } = useAdminI18n();
  const copy = text[language];
  const [adminNotes, setAdminNotes] = useState(order.adminNotes);
  const [shippingFeeAmount, setShippingFeeAmount] = useState(order.shippingFeeAmount?.toString() ?? "");
  const [shipmentDraft, setShipmentDraft] = useState<ShipmentDraft>(() => createShipmentDraft(order));
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

  const saveShipment = async () => {
    const shipment = await saveShipmentRecord(order.orderNo, shipmentDraft);

    if (shipment) {
      setShipmentDraft(createShipmentDraft({ ...order, shipments: [shipment, ...order.shipments.filter((item) => item.id !== shipment.id)] }));
    }
  };
  const bookShipment = async () => {
    const savedShipment = await saveShipmentRecord(order.orderNo, { ...shipmentDraft, status: "ready_to_book" });

    if (!savedShipment) {
      return;
    }

    const bookedShipment = await bookShipmentRecord(order.orderNo, savedShipment.id);
    const nextShipment = bookedShipment ?? savedShipment;
    setShipmentDraft(createShipmentDraft({ ...order, shipments: [nextShipment, ...order.shipments.filter((item) => item.id !== nextShipment.id)] }));
  };

  const shipmentLabel = (status: string) => copy.shipmentLabels[status as keyof typeof copy.shipmentLabels] ?? status;
  const codLabel = (status: string) => copy.codLabels[status as keyof typeof copy.codLabels] ?? status;
  const logisticsIssues = getOrderLogisticsIssues(order);
  const isJntOrder = isJntReceivingMethod(order.receivingMethod);
  const isLalamoveOrder = isLalamoveReceivingMethod(order.receivingMethod);
  const needsDeliveryPanel = isJntOrder || isLalamoveOrder;
  const shipmentPanelTitle = isLalamoveOrder ? (language === "zh" ? "Lalamove 人工安排" : "Lalamove Manual Coordination") : copy.shipmentPanelTitle;
  const shipmentDraftHint = isLalamoveOrder
    ? language === "zh"
      ? "Lalamove 不会自动叫车。记录我们手动叫车，或客户自己叫车的资料。"
      : "Lalamove is not booked automatically. Record whether Luis One manually books it or the customer books their own rider."
    : copy.shipmentDraftHint;
  const shipmentReadyText = isLalamoveOrder
    ? language === "zh"
      ? "Lalamove 只做人工协调；商品重量和尺寸可帮助估算费用。"
      : "Lalamove is manual coordination only; product weight and size can help estimate the fee."
    : "Product logistics are complete for courier booking.";
  const shipmentReviewText = language === "zh"
    ? `物流资料需检查：${logisticsIssues.messages.join("; ")}。`
    : `Logistics needs review: ${logisticsIssues.messages.join("; ")}.`;
  const saveShipmentLabel = isLalamoveOrder ? (language === "zh" ? "保存 Lalamove 记录" : "Save Lalamove Record") : copy.saveShipment;
  const shipmentAmountLabel = isLalamoveOrder ? (language === "zh" ? "订单金额" : "Order Amount") : copy.codAmount;

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
              value={order.salesAdminUserId}
              onChange={(event) => patchOrder(order.orderNo, { salesAdminUserId: event.target.value || null })}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-black text-zinc-700"
            >
              <option value="">{copy.unassignedSales}</option>
              {staffUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
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
              {copy.printA6}
            </button>
            <Link
              href={`/admin/orders/${encodeURIComponent(order.orderNo)}/customer-order`}
              target="_blank"
              className="grid rounded-md border border-zinc-200 px-4 py-2 text-sm font-black text-zinc-700"
            >
              {copy.printCustomerOrder}
            </Link>
            <Link
              href={`/admin/orders/${encodeURIComponent(order.orderNo)}/waybill`}
              target="_blank"
              className="grid rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800"
            >
              {copy.printWaybill}
            </Link>
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
          <Info label={t("shippingFeePayment")} value={shippingPaymentLabelFor(t, copy, order.shippingFeePayment)} />
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
            [t("shippingFeePayment"), shippingPaymentLabelFor(t, copy, order.shippingFeePayment)],
            [t("orderNotes"), order.orderNotes],
          ]} />
        </Panel>
      </div>

      <Panel title={copy.updateShipping}>
        <div className="grid gap-3 md:grid-cols-[240px_200px_auto]">
          <select
            value={order.shippingFeePayment}
            onChange={(event) => patchOrder(order.orderNo, { shippingFeePayment: event.target.value })}
            className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-orange-500"
          >
            {shippingFeePayments.map((option) => (
              <option key={option} value={option}>{shippingPaymentLabelFor(t, copy, option)}</option>
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

      {needsDeliveryPanel ? (
      <Panel title={shipmentPanelTitle}>
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {shipmentDraftHint}
        </div>
        <div className={`mb-4 rounded-md border px-4 py-3 text-sm font-bold ${logisticsIssues.ready ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {logisticsIssues.ready ? shipmentReadyText : shipmentReviewText}
        </div>
        <div className="grid gap-3 lg:grid-cols-4">
          <select
            value={shipmentDraft.status}
            onChange={(event) => setShipmentDraft((draft) => ({ ...draft, status: event.target.value }))}
            className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-orange-500"
            aria-label={copy.shipmentStatus}
          >
            {shipmentStatuses.map((status) => (
              <option key={status} value={status}>
                {shipmentLabel(status)}
              </option>
            ))}
          </select>
          {isJntOrder ? (
            <select
              value={shipmentDraft.codStatus}
              onChange={(event) => setShipmentDraft((draft) => ({ ...draft, codStatus: event.target.value }))}
              className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-orange-500"
              aria-label={copy.codStatus}
            >
              {codStatuses.map((status) => (
                <option key={status} value={status}>
                  {codLabel(status)}
                </option>
              ))}
            </select>
          ) : null}
          <input
            type="number"
            min="0"
            step="0.01"
            value={shipmentDraft.codAmount}
            onChange={(event) => setShipmentDraft((draft) => ({ ...draft, codAmount: event.target.value }))}
            placeholder={shipmentAmountLabel}
            className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
          />
          <input
            type="number"
            min="0"
            step="1"
            value={shipmentDraft.packageWeightGrams}
            onChange={(event) => setShipmentDraft((draft) => ({ ...draft, packageWeightGrams: event.target.value }))}
            placeholder={copy.packageWeight}
            className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
          />
          <input
            value={shipmentDraft.trackingNo}
            onChange={(event) => setShipmentDraft((draft) => ({ ...draft, trackingNo: event.target.value }))}
            placeholder={copy.trackingNo}
            className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
          />
          <input
            value={shipmentDraft.waybillNo}
            onChange={(event) => setShipmentDraft((draft) => ({ ...draft, waybillNo: event.target.value }))}
            placeholder={copy.waybillNo}
            className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              min="0"
              step="0.1"
              value={shipmentDraft.packageLengthCm}
              onChange={(event) => setShipmentDraft((draft) => ({ ...draft, packageLengthCm: event.target.value }))}
              placeholder="L"
              className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
              aria-label={`${copy.packageSize} length`}
            />
            <input
              type="number"
              min="0"
              step="0.1"
              value={shipmentDraft.packageWidthCm}
              onChange={(event) => setShipmentDraft((draft) => ({ ...draft, packageWidthCm: event.target.value }))}
              placeholder="W"
              className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
              aria-label={`${copy.packageSize} width`}
            />
            <input
              type="number"
              min="0"
              step="0.1"
              value={shipmentDraft.packageHeightCm}
              onChange={(event) => setShipmentDraft((draft) => ({ ...draft, packageHeightCm: event.target.value }))}
              placeholder="H"
              className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
              aria-label={`${copy.packageSize} height`}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={saveShipment} className="h-11 rounded-md bg-[#f65f18] px-4 text-sm font-black text-white">
            {saveShipmentLabel}
          </button>
          {isJntOrder ? (
            <button type="button" onClick={bookShipment} className="h-11 rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-800">
              {copy.bookShipment}
            </button>
          ) : null}
          <Link
            href={`/admin/orders/${encodeURIComponent(order.orderNo)}/waybill`}
            target="_blank"
            className="grid h-11 place-items-center rounded-md border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-800"
          >
            {copy.printWaybill}
          </Link>
          <Link
            href={`/admin/orders/${encodeURIComponent(order.orderNo)}/package-slip`}
            target="_blank"
            className="grid h-11 place-items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-800"
          >
            {copy.printPackageSlip}
          </Link>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <input
            value={shipmentDraft.receiverName}
            onChange={(event) => setShipmentDraft((draft) => ({ ...draft, receiverName: event.target.value }))}
            placeholder={t("receiverName")}
            className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
          />
          <input
            value={shipmentDraft.receiverPhone}
            onChange={(event) => setShipmentDraft((draft) => ({ ...draft, receiverPhone: event.target.value }))}
            placeholder={t("receiverPhone")}
            className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
          />
          <input
            value={shipmentDraft.receiverAddress}
            onChange={(event) => setShipmentDraft((draft) => ({ ...draft, receiverAddress: event.target.value }))}
            placeholder={t("completeAddress")}
            className="h-11 rounded-md border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-orange-500"
          />
        </div>
        <textarea
          value={shipmentDraft.notes}
          onChange={(event) => setShipmentDraft((draft) => ({ ...draft, notes: event.target.value }))}
          placeholder={copy.shipmentNotes}
          className="mt-3 min-h-20 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{copy.latestShipment}</th>
                <th className="px-4 py-3">{copy.shipmentStatus}</th>
                <th className="px-4 py-3">{copy.codStatus}</th>
                <th className="px-4 py-3">{shipmentAmountLabel}</th>
                <th className="px-4 py-3">{copy.trackingNo}</th>
                <th className="px-4 py-3">{copy.waybillNo}</th>
                <th className="px-4 py-3">{t("date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {order.shipments.length ? (
                order.shipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td className="px-4 py-3 font-black uppercase text-zinc-900">{shipment.provider}</td>
                    <td className="px-4 py-3"><StatusPill tone="orange">{shipmentLabel(shipment.status)}</StatusPill></td>
                    <td className="px-4 py-3"><StatusPill tone="green">{codLabel(shipment.codStatus)}</StatusPill></td>
                    <td className="px-4 py-3 font-black text-orange-700">{shipment.codAmount === null ? "-" : formatPhp(shipment.codAmount)}</td>
                    <td className="px-4 py-3 text-zinc-600">{shipment.trackingNo || "-"}</td>
                    <td className="px-4 py-3 text-zinc-600">{shipment.waybillNo || "-"}</td>
                    <td className="px-4 py-3 text-zinc-600">{shipment.createdDate || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-5 text-zinc-500" colSpan={7}>{copy.noShipments}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      ) : null}

      <Panel title={t("productItems")}>
        <div className="mb-3 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
          {t("supplierNotesAdminOnly")}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t("productImage")}</th>
                <th className="px-4 py-3">{t("sku")}</th>
                <th className="px-4 py-3">{t("productName")}</th>
                <th className="px-4 py-3">{t("quantity")}</th>
                <th className="px-4 py-3">{t("unitPriceSnapshot")}</th>
                <th className="px-4 py-3">{t("subtotal")}</th>
                <th className="px-4 py-3">{t("stockStatus")}</th>
                <th className="px-4 py-3">Logistics</th>
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
                  <td className="px-4 py-3 text-xs font-bold text-zinc-600">
                    <span className="block">{item.weightGrams ? `${item.weightGrams}g` : "No weight"}</span>
                    <span className="block">
                      {item.lengthCm && item.widthCm && item.heightCm ? `${item.lengthCm} x ${item.widthCm} x ${item.heightCm}cm` : "No size"}
                    </span>
                    <span className="mt-1 block text-zinc-500">
                      {[item.shippingCategory, item.codEnabled ? "COD" : "No COD", item.fragile ? "fragile" : "", item.containsBattery ? "battery" : "", item.containsLiquid ? "liquid" : ""]
                        .filter(Boolean)
                        .join(" / ")}
                    </span>
                  </td>
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

function PrintOrderTemplate({ order, t }: { order: AdminOrderRecord; t: (key: TranslationKey) => string }) {
  const shippingFee =
    order.shippingFeePayment === "freight_collect"
      ? "Paid to Rider / Receiver"
      : order.shippingFeeAmount === null
        ? shippingPaymentLabelFor(t, text.en, order.shippingFeePayment)
        : formatPhp(order.shippingFeeAmount);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const recordedPayments = order.payments.filter((payment) => payment.status !== "rejected");
  const recordedPaymentTotal = recordedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const balanceToConfirm = Math.max(0, order.amountToConfirm - recordedPaymentTotal);

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

          body * {
            visibility: hidden;
          }

          .a6-order-sheet,
          .a6-order-sheet * {
            visibility: visible;
          }

          .a6-order-sheet {
            position: absolute;
            left: 0;
            top: 0;
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
            <h1 className="text-[13px] font-black uppercase leading-4">{businessInfo.name}</h1>
            <p className="text-[8px] font-bold uppercase tracking-wide text-zinc-600">Online Wholesale Order Slip</p>
            <p className="mt-0.5 text-[7px] font-bold text-zinc-500">{businessInfo.address}</p>
            <p className="text-[7px] font-bold text-zinc-500">{businessInfo.phoneDisplay} | {businessInfo.hours}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black">{order.orderNo}</p>
            <p className="text-[8px] font-bold text-zinc-600">{order.createdDate}</p>
            <p className="mt-1 text-[7px] font-black uppercase text-orange-700">{labelFor(t, statusKeyByValue, order.orderStatus)}</p>
          </div>
        </div>

        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <A6Box title="Customer">
            <A6Row label="Name" value={order.customerName} />
            <A6Row label="Phone" value={order.customerPhone} />
            <A6Row label="FB" value={order.facebookMessenger || "-"} />
            <A6Row label="Type" value={order.businessType || "-"} />
          </A6Box>
          <A6Box title="Receiver">
            <A6Row label="Name" value={order.receiverName} />
            <A6Row label="Phone" value={order.receiverPhone} />
            <A6Row label="Method" value={labelFor(t, receivingMethodKeyByValue, order.receivingMethod)} />
            <A6Row label="Sales" value={order.salesName || "Online"} />
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

        {recordedPayments.length ? (
          <A6Box title="Payment Records" className="mt-1.5">
            {recordedPayments.slice(0, 3).map((payment) => (
              <div key={payment.id} className="flex justify-between gap-2 text-[8px] font-bold">
                <span className="break-words">{payment.method}{payment.referenceNo ? ` / ${payment.referenceNo}` : ""}</span>
                <span className="shrink-0">{formatPhp(payment.amount)}</span>
              </div>
            ))}
            {recordedPayments.length > 3 ? <p className="text-[7px] font-bold text-zinc-500">+ {recordedPayments.length - 3} more payment record(s)</p> : null}
          </A6Box>
        ) : null}

        <div className="mt-1.5 grid grid-cols-[1fr_37mm] gap-1.5">
          <A6Box title="Handling">
            <A6Check label={`${itemCount} pc(s) counted`} />
            <A6Check label="SKU / variant checked" />
            <A6Check label="Customer confirmed" />
            <A6Check label="Items picked / packed" />
            <A6Check label="Deposit / payment checked" />
            <A6Check label="Pickup / delivery arranged" />
            <p className="mt-1 text-[7px] text-zinc-600">Confirm receiving method and delivery fee before release.</p>
          </A6Box>
          <A6Box title="Total">
            <A6Total label="Product" value={formatPhp(order.productTotal)} />
            <A6Total label="Shipping" value={shippingFee} />
            <A6Total label="Recorded" value={formatPhp(recordedPaymentTotal)} />
            <A6Total label="Balance" value={formatPhp(balanceToConfirm)} />
            <A6Total label="Payment" value={labelFor(t, statusKeyByValue, order.paymentStatus)} />
            <div className="mt-1 border-t border-zinc-300 pt-1">
              <A6Total label="Confirm" value={formatPhp(order.amountToConfirm)} strong />
            </div>
          </A6Box>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3 text-[8px] font-bold">
          <div>
            <div className="h-6 border-b border-zinc-500" />
            <p className="mt-1">Prepared</p>
          </div>
          <div>
            <div className="h-6 border-b border-zinc-500" />
            <p className="mt-1">Cashier</p>
          </div>
          <div>
            <div className="h-6 border-b border-zinc-500" />
            <p className="mt-1">Receiver</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function A6Check({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1 text-[8px] font-bold">
      <span className="inline-block h-[7px] w-[7px] border border-zinc-700" />
      <span>{label}</span>
    </div>
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
