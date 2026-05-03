"use client";

import { useMemo, useState } from "react";
import { ProductInquiryButton } from "@/components/ProductInquiryButton";
import { addProductToCart } from "@/lib/customer-cart";
import { formatMoney, getTierForQuantity, type Product } from "@/lib/mock-data";

export function ProductDetailActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(product.moq);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const appliedTier = useMemo(() => getTierForQuantity(product, quantity), [product, quantity]);
  const subtotal = appliedTier.price * quantity;

  const addToOrder = async () => {
    setLoading(true);
    const result = await addProductToCart(product.id, quantity);
    setLoading(false);
    setSuccess(result.ok);
    setMessage(result.message);
  };

  return (
    <aside className="h-fit rounded-sm border border-orange-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">Order Calculator</p>
      <label className="mt-4 block text-sm font-black text-zinc-800">
        Quantity
        <div className="mt-2 flex overflow-hidden rounded-sm border border-zinc-200">
          <button type="button" onClick={() => setQuantity((current) => Math.max(product.moq, current - 1))} className="h-12 w-12 bg-zinc-50 text-lg font-black text-zinc-700">-</button>
          <input
            type="number"
            min={product.moq}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(product.moq, Number(event.target.value) || product.moq))}
            className="h-12 min-w-0 flex-1 px-3 text-center text-base font-black outline-none"
          />
          <button type="button" onClick={() => setQuantity((current) => current + 1)} className="h-12 w-12 bg-zinc-50 text-lg font-black text-zinc-700">+</button>
        </div>
        <span className="mt-2 block text-xs font-bold text-zinc-500">MOQ notice: minimum {product.moq} pc per order.</span>
      </label>

      <div className="mt-4 rounded-sm bg-orange-50 p-4 ring-1 ring-orange-100">
        <div className="flex justify-between gap-4 text-sm">
          <span className="font-bold text-zinc-600">Applied tier</span>
          <span className="font-black text-zinc-950">{appliedTier.label}</span>
        </div>
        <div className="mt-3 flex justify-between gap-4 text-sm">
          <span className="font-bold text-zinc-600">Unit price</span>
          <span className="text-xl font-black text-[#f65f18]">{formatMoney(appliedTier.price)}</span>
        </div>
        <div className="mt-3 flex justify-between gap-4 border-t border-orange-100 pt-3 text-sm">
          <span className="font-black text-zinc-950">Subtotal</span>
          <span className="text-2xl font-black text-zinc-950">{formatMoney(subtotal)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={addToOrder}
        disabled={loading}
        className="mt-4 h-12 w-full rounded-sm bg-[#f65f18] px-5 text-sm font-black text-white transition hover:bg-[#df4f0d] disabled:cursor-not-allowed disabled:bg-orange-300"
      >
        {loading ? "Adding..." : "Add to Order"}
      </button>
      <ProductInquiryButton product={product} label="Chat About This Product" className="mt-3 h-12 w-full text-sm" />
      {message ? (
        <p className={`mt-3 rounded-sm border px-4 py-3 text-sm font-bold ${success ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-orange-200 bg-orange-50 text-orange-700"}`}>
          {message}
        </p>
      ) : null}
    </aside>
  );
}
