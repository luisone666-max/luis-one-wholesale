"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useState } from "react";
import { AdminShell, useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPageTitle, Pager, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { adminOrders, AdminOrder } from "@/lib/admin-mock-data";

function OrdersContent() {
  const { t } = useAdminI18n();
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder>(adminOrders[0]);

  return (
    <>
      <AdminPageTitle titleKey="orders" />
      <div className="mb-4 rounded-md border border-orange-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <StatusPill tone="orange">{t("shippingFeeSeparate")}</StatusPill>
          <StatusPill tone="neutral">{t("freightCollect")}</StatusPill>
          <StatusPill tone="neutral">{t("noAutomaticPricing")}</StatusPill>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-zinc-600">
          {[t("pickUpAtStore"), t("localDelivery"), t("courierShipping"), t("toBeConfirmed")].map((method) => (
            <span key={method} className="rounded bg-zinc-100 px-3 py-2">{method}</span>
          ))}
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
              {adminOrders.map((order) => (
                <tr key={order.orderNo} className={selectedOrder.orderNo === order.orderNo ? "bg-orange-50/50" : "bg-white"}>
                  <td className="px-4 py-4 font-black text-zinc-950">{order.orderNo}</td>
                  <td className="px-4 py-4 text-zinc-700">{order.customerName}</td>
                  <td className="px-4 py-4 text-zinc-600">{order.customerPhone}</td>
                  <td className="px-4 py-4 font-black text-orange-700">{order.productTotal}</td>
                  <td className="px-4 py-4"><StatusPill tone="orange">{t(order.orderStatusKey)}</StatusPill></td>
                  <td className="px-4 py-4"><StatusPill tone="green">{t(order.paymentStatusKey)}</StatusPill></td>
                  <td className="px-4 py-4 text-zinc-600">{t(order.receivingMethodKey)}</td>
                  <td className="px-4 py-4 text-zinc-600">{t(order.shippingFeePaymentKey)}</td>
                  <td className="px-4 py-4 text-zinc-600">{order.date}</td>
                  <td className="px-4 py-4">
                    <button type="button" onClick={() => setSelectedOrder(order)} className="rounded-md border border-orange-200 px-3 py-2 text-xs font-black text-orange-700">
                      {t("view")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager />
      </TableShell>

      <OrderDetail order={selectedOrder} />
    </>
  );
}

function OrderDetail({ order }: { order: AdminOrder }) {
  const { t } = useAdminI18n();

  return (
    <section className="mt-5 space-y-5">
      <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">{t("orderSummary")}</p>
            <h2 className="mt-1 text-2xl font-black text-zinc-950">{order.orderNo}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white" type="button">{t("updateOrderStatus")}</button>
            <button className="rounded-md border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700" type="button">{t("updatePaymentStatus")}</button>
            <button className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-black text-zinc-700" type="button">{t("addPaymentRecord")}</button>
            <button className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-black text-zinc-700" type="button">{t("addDeliveryFee")}</button>
            <button className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-black text-zinc-700" type="button">{t("markFreightCollect")}</button>
            <button className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-black text-zinc-700" type="button">{t("printOrder")}</button>
            <button className="rounded-md border border-red-200 px-4 py-2 text-sm font-black text-red-700" type="button">{t("cancelOrder")}</button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Info label={t("createdDate")} value={order.createdDate} />
          <Info label={t("productTotal")} value={order.productTotal} emphasis />
          <Info label={t("shippingFeePayment")} value={t(order.shippingFeePaymentKey)} />
          <Info label={t("shippingFeeAmount")} value={order.shippingFeeAmount} />
          <Info label={t("amountToConfirm")} value={order.amountToConfirm} emphasis />
          <Info label={t("orderStatus")} value={t(order.orderStatusKey)} />
          <Info label={t("paymentStatus")} value={t(order.paymentStatusKey)} />
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
            [t("receivingMethod"), t(order.receivingMethodKey)],
            [t("completeAddress"), order.completeAddress],
            [t("shippingFeePayment"), t(order.shippingFeePaymentKey)],
            [t("orderNotes"), order.orderNotes],
          ]} />
        </Panel>
      </div>

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
                <tr key={item.sku}>
                  <td className="px-4 py-3">
                    <div className="h-14 w-14 rounded-md bg-orange-50 p-1">
                      <Image src={item.image} alt={item.name} width={56} height={56} className="h-full w-full object-contain" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-black text-zinc-950">{item.sku}</td>
                  <td className="px-4 py-3 font-bold text-zinc-800">{item.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-zinc-600">{item.unitPrice}</td>
                  <td className="px-4 py-3 font-black text-orange-700">{item.subtotal}</td>
                  <td className="px-4 py-3"><StatusPill tone="orange">{t(item.stockStatusKey)}</StatusPill></td>
                  <td className="px-4 py-3 text-zinc-600">{item.supplierNotesSnapshot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Panel title={t("paymentRecords")}>
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
                  <tr key={payment.referenceNo}>
                    <td className="px-4 py-3 text-zinc-600">{payment.method}</td>
                    <td className="px-4 py-3 font-black text-orange-700">{payment.amount}</td>
                    <td className="px-4 py-3 text-zinc-600">{payment.referenceNo}</td>
                    <td className="px-4 py-3"><StatusPill tone="green">{t(payment.statusKey)}</StatusPill></td>
                    <td className="px-4 py-3 text-zinc-600">{payment.date}</td>
                    <td className="px-4 py-3"><div className="h-12 w-16 rounded bg-zinc-100 ring-1 ring-zinc-200" /></td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-4 py-5 text-zinc-500" colSpan={6}>{t("noPayment")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title={t("adminNotes")}>
          <textarea defaultValue={order.adminNotes} className="min-h-40 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700" />
          <button type="button" className="mt-3 h-10 rounded-md bg-[#f65f18] px-4 text-sm font-black text-white">
            {t("saveNote")}
          </button>
        </Panel>
      </div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
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

export default function AdminOrdersPage() {
  return (
    <AdminShell>
      <OrdersContent />
    </AdminShell>
  );
}
