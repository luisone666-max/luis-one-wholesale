"use client";

import { useMemo, useState } from "react";
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
    <div className="rounded-md border border-orange-200 bg-orange-50/70 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-bold text-zinc-800">
          Quantity
          <input
            type="number"
            min={product.moq}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(product.moq, Number(event.target.value) || product.moq))}
            className="mt-2 h-12 w-full rounded-md border border-orange-200 bg-white px-4 text-base font-bold outline-none focus:border-orange-500"
          />
          <span className="mt-1 block text-xs font-bold text-zinc-500">MOQ {product.moq} pc</span>
        </label>
        <div className="rounded-md bg-white p-4 ring-1 ring-orange-100">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Applied tier</p>
          <p className="mt-1 text-lg font-black text-zinc-950">{appliedTier.label}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 rounded-md bg-white p-4 ring-1 ring-orange-100 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Unit price</p>
          <p className="mt-1 text-2xl font-black text-[#f65f18]">{formatMoney(appliedTier.price)}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Subtotal</p>
          <p className="mt-1 text-2xl font-black text-zinc-950">{formatMoney(subtotal)}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={addToOrder}
        disabled={loading}
        className="mt-4 h-12 w-full rounded-md bg-[#f65f18] px-5 text-sm font-black text-white transition hover:bg-[#df4f0d] disabled:cursor-not-allowed disabled:bg-orange-300"
      >
        {loading ? "Adding..." : "Add to Order"}
      </button>
      {message ? (
        <p
          className={`mt-3 rounded-md border px-4 py-3 text-sm font-bold ${
            success ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-orange-200 bg-white text-orange-700"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
