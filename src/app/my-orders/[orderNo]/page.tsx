"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerAuthGate } from "@/components/auth/CustomerAuthGate";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCustomerOrderDetail, type CustomerOrderDetail } from "@/lib/customer-orders";
import {
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getReceivingMethodLabel,
  getShippingFeePaymentLabel,
} from "@/lib/order-labels";
import { formatPhp } from "@/lib/wholesale-pricing";

export default function CustomerOrderDetailPage() {
  return (
    <>
      <SiteHeader />
      <CustomerAuthGate>
        <OrderDetailContent />
      </CustomerAuthGate>
      <SiteFooter />
    </>
  );
}

function OrderDetailContent() {
  const params = useParams<{ orderNo: string }>();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      void (async () => {
        const result = await getCustomerOrderDetail(decodeURIComponent(params.orderNo));

        if (!active) {
          return;
        }

        setOrder(result.order);
        setMessage(result.error ?? "");
        setLoading(false);
      })();
    });

    return () => {
      active = false;
    };
  }, [params.orderNo]);

  return (
    <main className="bg-zinc-50">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-sm border border-orange-100 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Order Detail</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{order?.orderNo ?? "Loading order"}</h1>
          </div>
          <Link href="/my-orders" className="rounded-sm border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700">
            Back to My Orders
          </Link>
        </div>

        {loading ? <div className="rounded-sm border border-zinc-200 bg-white p-6 text-sm font-bold text-zinc-600">Loading order...</div> : null}
        {message ? <div className="rounded-sm border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-700">{message}</div> : null}

        {order ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <section className="rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-zinc-950">Receiver Info</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Info label="Receiver Name" value={order.receiverName ?? ""} />
                  <Info label="Receiver Phone" value={order.receiverPhone ?? ""} />
                  <Info label="Receiving Method" value={getReceivingMethodLabel(order.receivingMethod)} />
                  <Info label="Shipping Fee Payment" value={getShippingFeePaymentLabel(order.shippingFeePayment)} />
                  {order.completeAddress ? <Info label="Complete Address" value={order.completeAddress} wide /> : null}
                </div>
              </section>

              <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-100 p-6">
                  <h2 className="text-xl font-black text-zinc-950">Product Items</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                      <tr>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Product Name</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3">Unit Price Snapshot</th>
                        <th className="px-4 py-3">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-4 font-bold text-zinc-600">{item.sku}</td>
                          <td className="px-4 py-4 font-black text-zinc-950">
                            {item.productName}
                            {item.variantName ? <span className="mt-1 block text-xs font-bold text-orange-700">Variant: {item.variantName}</span> : null}
                          </td>
                          <td className="px-4 py-4 text-zinc-600">{item.quantity}</td>
                          <td className="px-4 py-4 font-black text-orange-700">{formatPhp(item.unitPrice)}</td>
                          <td className="px-4 py-4 font-black text-zinc-950">{formatPhp(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside className="h-fit rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-zinc-950">Order Summary</h2>
              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Order No" value={order.orderNo} />
                <SummaryRow label="Product Total" value={formatPhp(order.productTotal)} strong />
                <SummaryRow label="Order Status" value={getOrderStatusLabel(order.orderStatus)} />
                <SummaryRow label="Payment Status" value={getPaymentStatusLabel(order.paymentStatus)} />
                <SummaryRow label="Shipping Fee" value="Arranged manually" />
              </div>
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Info({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-sm bg-zinc-50 p-4 ring-1 ring-zinc-100 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-2 font-black text-zinc-950">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className={strong ? "font-black text-zinc-950" : "text-zinc-600"}>{label}</span>
      <span className={strong ? "text-xl font-black text-[#f65f18]" : "font-bold text-zinc-950"}>{value}</span>
    </div>
  );
}
