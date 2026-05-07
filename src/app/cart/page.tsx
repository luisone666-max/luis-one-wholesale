"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CustomerAuthGate } from "@/components/auth/CustomerAuthGate";
import { messengerUrl } from "@/components/CustomerUi";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  getCustomerCartItems,
  removeCartItem,
  updateCartItemQuantity,
  type CustomerCartItem,
} from "@/lib/customer-cart";
import { notifyCustomerCartUpdated } from "@/lib/customer-cart-events";
import { calculateLoyaltyPoints, formatLoyaltyPoints } from "@/lib/loyalty-points";
import { formatPhp } from "@/lib/wholesale-pricing";

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <CustomerAuthGate>
        <CartContent />
      </CustomerAuthGate>
      <SiteFooter />
    </>
  );
}

function CartContent() {
  const [items, setItems] = useState<CustomerCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const productTotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.subtotal ?? 0), 0),
    [items],
  );
  const hasBlockingCartIssue = useMemo(() => items.some((item) => Boolean(item.priceError) || item.subtotal === null), [items]);
  const estimatedPoints = calculateLoyaltyPoints(productTotal);

  const loadCart = useCallback(async () => {
    const result = await getCustomerCartItems();
    setItems(result.items);
    setMessage(result.error ?? "");
    setLoading(false);
    notifyCustomerCartUpdated();
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
        notifyCustomerCartUpdated();
      })();
    });

    return () => {
      active = false;
    };
  }, []);

  const setLocalQuantity = (itemId: string, quantity: number) => {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, quantity: Math.max(1, Math.floor(quantity) || 1) } : item)),
    );
  };

  const saveQuantity = async (itemId: string, quantity: number) => {
    setActionLoadingId(itemId);
    setMessage("");
    const result = await updateCartItemQuantity(itemId, quantity);
    setActionLoadingId(null);

    if (!result.ok) {
      setMessage(result.message);
      await loadCart();
      return;
    }

    setMessage(result.message);
    await loadCart();
  };

  const removeItem = async (itemId: string) => {
    setActionLoadingId(itemId);
    setMessage("");
    const result = await removeCartItem(itemId);
    setActionLoadingId(null);
    setMessage(result.message);
    await loadCart();
  };

  return (
    <main className="bg-zinc-50">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-md border border-orange-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Wholesale order cart</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Review items before checkout</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
            Quantity changes update the applied wholesale unit price. Product total and shipping fee are confirmed separately.
          </p>
        </div>

        {message ? (
          <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
            <div className="grid grid-cols-[96px_1fr_150px_120px_130px_100px] gap-4 border-b border-zinc-100 bg-zinc-50 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-500 max-lg:hidden">
              <span>Image</span>
              <span>Product</span>
              <span>Quantity</span>
              <span>Unit Price</span>
              <span>Subtotal</span>
              <span>Remove</span>
            </div>

            {loading ? (
              <div className="p-6 text-sm font-bold text-zinc-600">Loading order cart...</div>
            ) : items.length ? (
              <div className="divide-y divide-zinc-100">
                {items.map((item) => {
                  const itemNeedsMessenger = Boolean(item.priceError) || item.subtotal === null;

                  return (
                    <div
                      key={item.id}
                      className="grid gap-4 p-5 lg:grid-cols-[96px_1fr_150px_120px_130px_100px] lg:items-center"
                    >
                      <div className="h-24 w-24 rounded-md bg-orange-50 p-2">
                        <Image src={item.image} alt={item.name} width={120} height={120} className="h-full w-full object-contain" />
                      </div>
                      <div>
                        <Link href={`/product/${item.slug}`} className="font-black text-zinc-950 hover:text-orange-700">
                          {item.name}
                        </Link>
                        {item.variantName ? (
                          <p className="mt-2 text-sm font-black text-orange-700">Variant: {item.variantName}</p>
                        ) : null}
                        <p className="mt-2 text-sm font-bold text-zinc-500">
                          {item.variantSku ? `Variant SKU: ${item.variantSku}` : `SKU: ${item.sku}`}
                        </p>
                        <p className="mt-1 text-xs font-bold text-orange-700">
                          {item.tierLabel ? `${item.tierLabel} applied` : item.priceError}
                        </p>
                        <p className="mt-1 text-xs font-bold text-zinc-500">MOQ {item.moq} pc</p>
                        {itemNeedsMessenger ? (
                          <a
                            href={messengerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex rounded-sm bg-[#f65f18] px-3 py-2 text-xs font-black text-white hover:bg-[#df4f0d]"
                          >
                            Ask on Messenger
                          </a>
                        ) : null}
                      </div>
                      <div className="flex w-full items-center overflow-hidden rounded-md border border-zinc-200 bg-white">
                        <button
                          type="button"
                          onClick={() => saveQuantity(item.id, item.quantity - 1)}
                          disabled={actionLoadingId === item.id || itemNeedsMessenger}
                          className="h-11 w-10 border-r border-zinc-200 text-lg font-black text-zinc-600 disabled:text-zinc-300"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          disabled={itemNeedsMessenger}
                          onChange={(event) => setLocalQuantity(item.id, Number(event.target.value) || 1)}
                          onBlur={() => saveQuantity(item.id, item.quantity)}
                          className="h-11 w-full px-2 text-center text-sm font-black outline-none disabled:bg-zinc-50 disabled:text-zinc-400"
                        />
                        <button
                          type="button"
                          onClick={() => saveQuantity(item.id, item.quantity + 1)}
                          disabled={actionLoadingId === item.id || itemNeedsMessenger}
                          className="h-11 w-10 border-l border-zinc-200 text-lg font-black text-zinc-600 disabled:text-zinc-300"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-black text-orange-700">
                        {item.appliedUnitPrice === null ? "Contact us" : formatPhp(item.appliedUnitPrice)}
                      </p>
                      <p className="text-lg font-black text-zinc-950">
                        {item.subtotal === null ? "To confirm" : formatPhp(item.subtotal)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={actionLoadingId === item.id}
                        className="h-10 rounded-md border border-red-200 px-3 text-sm font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <h2 className="text-xl font-black text-zinc-950">Your order cart is empty</h2>
                <p className="mt-2 text-sm text-zinc-600">Add wholesale products from the catalog to prepare an order list.</p>
                <Link
                  href="/category/all"
                  className="mt-5 inline-flex rounded-md bg-[#f65f18] px-5 py-3 text-sm font-black text-white"
                >
                  Continue Shopping
                </Link>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-zinc-950">Order Summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <SummaryRow label="Product Total" value={formatPhp(productTotal)} />
              <SummaryRow label="Shipping Fee" value="To be confirmed / Freight Collect" />
              <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-700">
                If shipping is freight collect, shipping fee is paid by receiver and is not added to product total.
              </div>
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-700">
                Member points estimate: {formatLoyaltyPoints(estimatedPoints)} after payment is confirmed. Every PHP 100 = 1 point.
              </div>
              {hasBlockingCartIssue ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
                  One or more items need Messenger confirmation before checkout. Please remove unavailable items or ask us first.
                </div>
              ) : null}
              <div className="border-t border-zinc-100 pt-4">
                <SummaryRow label="Amount to Confirm" value={formatPhp(productTotal)} strong />
              </div>
            </div>
            {hasBlockingCartIssue ? (
              <div className="mt-6 space-y-3">
                <a
                  href={messengerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-sm bg-[#f65f18] px-5 py-3 text-center text-sm font-black text-white"
                >
                  Ask on Messenger
                </a>
                <button
                  type="button"
                  disabled
                  className="block w-full cursor-not-allowed rounded-sm bg-zinc-200 px-5 py-3 text-center text-sm font-black text-zinc-500"
                >
                  Checkout unavailable
                </button>
              </div>
            ) : (
              <Link href="/checkout" className="mt-6 block rounded-sm bg-[#f65f18] px-5 py-3 text-center text-sm font-black text-white">
                Proceed to Checkout
              </Link>
            )}
          </aside>
        </div>
      </section>
    </main>
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
