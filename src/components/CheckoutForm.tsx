"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCustomerCartItems, type CustomerCartItem } from "@/lib/customer-cart";
import { calculateLoyaltyPoints, formatLoyaltyPoints } from "@/lib/loyalty-points";
import type { ReceivingMethod, ShippingFeePayment } from "@/lib/order-labels";
import { receivingMethodLabels, shippingFeePaymentLabels } from "@/lib/order-labels";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatPhp } from "@/lib/wholesale-pricing";

const receivingMethods: ReceivingMethod[] = ["pickup", "local_delivery", "courier_shipping", "to_be_arranged"];

type AddressDraft = {
  unitLandmark: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  notes: string;
};

function buildCompleteAddress(address: AddressDraft) {
  return [
    address.unitLandmark,
    address.street,
    address.barangay,
    address.city,
    address.province,
    address.notes,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function getShippingOptions(method: ReceivingMethod): ShippingFeePayment[] {
  if (method === "pickup") {
    return ["no_shipping_fee"];
  }

  if (method === "local_delivery") {
    return ["freight_collect", "prepaid", "to_be_confirmed"];
  }

  if (method === "to_be_arranged") {
    return ["to_be_confirmed"];
  }

  return ["freight_collect", "prepaid", "to_be_confirmed"];
}

function getDefaultShippingPayment(method: ReceivingMethod): ShippingFeePayment {
  if (method === "pickup") {
    return "no_shipping_fee";
  }

  if (method === "courier_shipping") {
    return "freight_collect";
  }

  if (method === "to_be_arranged") {
    return "to_be_confirmed";
  }

  return "to_be_confirmed";
}

export function CheckoutForm() {
  const router = useRouter();
  const [items, setItems] = useState<CustomerCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receivingMethod, setReceivingMethod] = useState<ReceivingMethod>("courier_shipping");
  const [completeAddress, setCompleteAddress] = useState("");
  const [addressDraft, setAddressDraft] = useState<AddressDraft>({
    unitLandmark: "",
    street: "",
    barangay: "",
    city: "",
    province: "Metro Manila",
    notes: "",
  });
  const [shippingFeePayment, setShippingFeePayment] = useState<ShippingFeePayment>("freight_collect");
  const [orderNotes, setOrderNotes] = useState("");
  const shippingOptions = useMemo(() => getShippingOptions(receivingMethod), [receivingMethod]);
  const productTotal = useMemo(() => items.reduce((sum, item) => sum + (item.subtotal ?? 0), 0), [items]);
  const estimatedPoints = calculateLoyaltyPoints(productTotal);
  const invalidCartItem = items.find((item) => item.priceError || item.appliedUnitPrice === null || item.subtotal === null);
  const addressRequired = receivingMethod === "local_delivery" || receivingMethod === "courier_shipping";

  const loadCart = useCallback(async () => {
    const result = await getCustomerCartItems();
    setItems(result.items);
    setMessage(result.error ?? "");
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      void (async () => {
        const result = await getCustomerCartItems();

        if (!active) {
          return;
        }

        setItems(result.items);
        setMessage(result.error ?? "");
        setLoading(false);
      })();
    });

    return () => {
      active = false;
    };
  }, []);

  const changeReceivingMethod = (method: ReceivingMethod) => {
    setReceivingMethod(method);
    setShippingFeePayment(getDefaultShippingPayment(method));
  };

  const updateAddressDraft = (field: keyof AddressDraft, value: string) => {
    const nextAddress = { ...addressDraft, [field]: value };

    setAddressDraft(nextAddress);
    setCompleteAddress(buildCompleteAddress(nextAddress));
  };

  const submitOrder = async () => {
    setMessage("");

    if (!items.length) {
      setMessage("Your cart is empty. Please add products before checkout.");
      return;
    }

    if (invalidCartItem) {
      setMessage(invalidCartItem.priceError ?? "One or more cart items need quotation before checkout.");
      return;
    }

    if (!receiverName.trim()) {
      setMessage("Receiver Name is required.");
      return;
    }

    if (!receiverPhone.trim()) {
      setMessage("Receiver Phone Number is required.");
      return;
    }

    if (addressRequired && !completeAddress.trim()) {
      setMessage("Complete Address is required for delivery or courier shipping.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = (await supabase?.auth.getSession()) ?? { data: { session: null } };

    if (!session?.access_token) {
      setMessage("Please login before placing an order.");
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/orders/submit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        receiverName,
        receiverPhone,
        receivingMethod,
        completeAddress,
        shippingFeePayment,
        orderNotes,
      }),
    });
    const result = (await response.json().catch(() => ({ ok: false, message: "Order submission failed." }))) as {
      ok?: boolean;
      message?: string;
      orderNo?: string;
    };
    setSubmitting(false);

    if (!response.ok || !result.ok || !result.orderNo) {
      setMessage(result.message ?? "Order submission failed.");
      await loadCart();
      return;
    }

    router.push(`/order-success?order=${encodeURIComponent(result.orderNo)}`);
  };

  return (
    <main className="bg-[#f6f6f6]">
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Checkout</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Receiver Information</h1>
          {message ? (
            <div className="mt-5 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
              {message}
            </div>
          ) : null}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Receiver Name" value={receiverName} onChange={setReceiverName} required />
            <Field label="Receiver Phone Number" value={receiverPhone} onChange={setReceiverPhone} required />
            <label className="block text-sm font-bold text-zinc-800">
              Receiving Method
              <select
                value={receivingMethod}
                onChange={(event) => changeReceivingMethod(event.target.value as ReceivingMethod)}
                className="mt-2 h-12 w-full rounded-sm border border-zinc-200 bg-white px-4 outline-none focus:border-orange-500"
              >
                {receivingMethods.map((method) => (
                  <option key={method} value={method}>
                    {receivingMethodLabels[method]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-zinc-800">
              Shipping Fee Payment
              <select
                value={shippingFeePayment}
                onChange={(event) => setShippingFeePayment(event.target.value as ShippingFeePayment)}
                className="mt-2 h-12 w-full rounded-sm border border-zinc-200 bg-white px-4 outline-none focus:border-orange-500"
              >
                {shippingOptions.map((option) => (
                  <option key={option} value={option}>
                    {shippingFeePaymentLabels[option]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-zinc-800 sm:col-span-2">
              Delivery Address Template {addressRequired ? <span className="text-red-600">*</span> : <span className="text-zinc-400">(optional)</span>}
              {addressRequired ? (
                <div className="mt-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">
                  Fill this like a delivery template. Many Philippine streets and barangays have similar names, so please include landmark, barangay/zone, and clear delivery notes.
                </div>
              ) : null}
              <div className="mt-3 rounded-sm border border-zinc-200 bg-zinc-50 p-3 text-xs font-bold leading-5 text-zinc-600">
                Standard example: 2F Blue Gate beside 7-Eleven, Narra St, Brgy 238 Zone 22, Tondo, Manila, Metro Manila, near Puregold, call before delivery.
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <AddressField
                  label="House / Unit / Building / Landmark"
                  value={addressDraft.unitLandmark}
                  onChange={(value) => updateAddressDraft("unitLandmark", value)}
                  placeholder="Example: 2F Blue Gate, beside 7-Eleven"
                />
                <AddressField
                  label="Street"
                  value={addressDraft.street}
                  onChange={(value) => updateAddressDraft("street", value)}
                  placeholder="Example: Narra St"
                />
                <AddressField
                  label="Barangay / Zone"
                  value={addressDraft.barangay}
                  onChange={(value) => updateAddressDraft("barangay", value)}
                  placeholder="Example: Brgy 238, Zone 22"
                />
                <AddressField
                  label="City / Municipality"
                  value={addressDraft.city}
                  onChange={(value) => updateAddressDraft("city", value)}
                  placeholder="Example: Tondo, Manila"
                />
                <AddressField
                  label="Province / Area"
                  value={addressDraft.province}
                  onChange={(value) => updateAddressDraft("province", value)}
                  placeholder="Example: Metro Manila"
                />
                <AddressField
                  label="Extra Address Notes"
                  value={addressDraft.notes}
                  onChange={(value) => updateAddressDraft("notes", value)}
                  placeholder="Example: Near Puregold / red gate / call before delivery"
                />
              </div>
              <div className="mt-4 rounded-sm border border-orange-100 bg-orange-50 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-700">Complete Address Preview</p>
                <p className="mt-2 text-sm font-bold leading-6 text-zinc-800">
                  {completeAddress || "Your combined delivery address will appear here."}
                </p>
              </div>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Edit combined address if needed</p>
              <textarea
                value={completeAddress}
                onChange={(event) => setCompleteAddress(event.target.value)}
                className="mt-2 min-h-24 w-full rounded-sm border border-zinc-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </label>
            <label className="block text-sm font-bold text-zinc-800 sm:col-span-2">
              Order Notes
              <textarea
                value={orderNotes}
                onChange={(event) => setOrderNotes(event.target.value)}
                className="mt-2 min-h-24 w-full rounded-sm border border-zinc-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </label>
          </div>
        </div>

        <aside className="h-fit rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-zinc-950">Amount to Confirm</h2>
          <div className="mt-5 space-y-3 text-sm">
            {loading ? <p className="font-bold text-zinc-600">Loading cart...</p> : null}
            {!loading && !items.length ? (
              <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-700">
                Your cart is empty. Add products before checkout.
              </div>
            ) : null}
            {invalidCartItem ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
                One or more items need Messenger confirmation before checkout. Please go back to cart and remove unavailable items.
              </div>
            ) : null}
            {items.map((item) => (
              <div key={item.id} className="rounded-md bg-zinc-50 p-3 ring-1 ring-zinc-100">
                <p className="font-black text-zinc-950">{item.name}</p>
                <p className="mt-1 text-xs font-bold text-zinc-500">
                  {item.quantity} pcs x {item.appliedUnitPrice === null ? "To quote" : formatPhp(item.appliedUnitPrice)}
                </p>
              </div>
            ))}
            <SummaryRow label="Product Total" value={formatPhp(productTotal)} />
            <SummaryRow label="Shipping Fee Payment" value={shippingFeePaymentLabels[shippingFeePayment]} />
            <SummaryRow
              label="Shipping Fee"
              value={
                shippingFeePayment === "freight_collect"
                  ? "Paid by receiver"
                  : shippingFeePayment === "no_shipping_fee"
                    ? "PHP 0"
                    : "To be confirmed"
              }
            />
            <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-700">
              Freight collect is not added to product total. Shipping and pickup are arranged manually.
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-700">
              Member points estimate: {formatLoyaltyPoints(estimatedPoints)} after payment is confirmed. Every PHP 100 = 1 point.
            </div>
            <div className="border-t border-zinc-100 pt-4">
              <SummaryRow label="Amount to Confirm" value={formatPhp(productTotal)} strong />
            </div>
          </div>
          <button
            type="button"
            onClick={submitOrder}
            disabled={loading || submitting || !items.length || Boolean(invalidCartItem)}
            className="mt-6 block w-full rounded-sm bg-[#f65f18] px-5 py-3 text-center text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-orange-300"
          >
            {submitting ? "Submitting..." : "Place Order"}
          </button>
          <Link href="/cart" className="mt-3 block rounded-sm border border-zinc-200 bg-white px-5 py-3 text-center text-sm font-black text-zinc-700">
            Back to Cart
          </Link>
        </aside>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-bold text-zinc-800">
      {label} {required ? <span className="text-red-600">*</span> : null}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-sm border border-zinc-200 px-4 outline-none focus:border-orange-500"
      />
    </label>
  );
}

function AddressField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-xs font-black uppercase tracking-[0.08em] text-zinc-600">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-sm border border-zinc-200 px-3 text-sm font-bold normal-case tracking-normal text-zinc-900 outline-none placeholder:font-semibold placeholder:text-zinc-400 focus:border-orange-500"
      />
    </label>
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
