"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { messengerUrl } from "@/components/CustomerUi";
import { getCustomerOrderDetail, type CustomerOrderDetail } from "@/lib/customer-orders";
import { getReceivingMethodLabel, getShippingFeePaymentLabel } from "@/lib/order-labels";
import { formatPhp } from "@/lib/wholesale-pricing";

export function OrderSuccessDetails() {
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [message, setMessage] = useState("Loading submitted order...");

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      void (async () => {
        const orderNo = new URLSearchParams(window.location.search).get("order") ?? "";

        if (!orderNo) {
          setMessage("Order number is missing.");
          return;
        }

        const result = await getCustomerOrderDetail(orderNo);

        if (!active) {
          return;
        }

        setOrder(result.order);
        setMessage(result.error ?? "");
      })();
    });

    return () => {
      active = false;
    };
  }, []);

  if (!order) {
    return (
      <div className="rounded-sm border border-orange-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold text-zinc-600">{message}</p>
        <Link href="/my-orders" className="mt-5 inline-flex rounded-sm bg-[#f65f18] px-5 py-3 text-sm font-black text-white">
          View My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-sm border border-orange-100 bg-white text-center shadow-sm">
      <div className="bg-[#f65f18] px-6 py-8 text-white">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-3xl font-black text-[#f65f18]">✓</div>
        <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-orange-100">Order Received</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Order No: {order.orderNo}</h1>
      </div>
      <div className="p-6 sm:p-8">
      <div className="grid gap-4 text-left sm:grid-cols-2">
        <Info label="Product Total" value={formatPhp(order.productTotal)} />
        <Info label="Shipping Fee Payment" value={getShippingFeePaymentLabel(order.shippingFeePayment)} />
        <Info label="Receiver Name" value={order.receiverName ?? ""} />
        <Info label="Receiver Phone" value={order.receiverPhone ?? ""} />
        <Info label="Receiving Method" value={getReceivingMethodLabel(order.receivingMethod)} />
        {order.completeAddress ? <Info label="Complete Address" value={order.completeAddress} /> : null}
      </div>
      <p className="mt-8 rounded-sm border border-orange-200 bg-orange-50 p-4 text-sm font-bold leading-6 text-orange-700">
        We will contact you to confirm your order. Deposit may be required to secure your items. Shipping fee will be
        arranged manually.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/my-orders" className="rounded-sm bg-[#f65f18] px-5 py-3 text-sm font-black text-white">
          View My Orders
        </Link>
        <Link href={messengerUrl} className="rounded-sm border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-black text-orange-700">
          Chat on Messenger
        </Link>
        <Link href="/category/all" className="rounded-sm border border-zinc-200 bg-white px-5 py-3 text-sm font-black text-zinc-700">
          Continue Shopping
        </Link>
      </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-zinc-50 p-4 ring-1 ring-zinc-100">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-2 font-black text-zinc-950">{value}</p>
    </div>
  );
}
