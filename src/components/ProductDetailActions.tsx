"use client";

import { useMemo, useState } from "react";
import { formatMoney, getTierForQuantity, Product } from "@/lib/mock-data";

export function ProductDetailActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const appliedTier = useMemo(() => getTierForQuantity(product, quantity), [product, quantity]);
  const subtotal = appliedTier.price * quantity;

  return (
    <div className="rounded-md border border-orange-200 bg-orange-50/70 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-bold text-zinc-800">
          Quantity
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            className="mt-2 h-12 w-full rounded-md border border-orange-200 bg-white px-4 text-base font-bold outline-none focus:border-orange-500"
          />
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
        onClick={() => setMessage("Please login or register to place order.")}
        className="mt-4 h-12 w-full rounded-md bg-[#f65f18] px-5 text-sm font-black text-white transition hover:bg-[#df4f0d]"
      >
        Add to Order
      </button>
      {message ? (
        <p className="mt-3 rounded-md border border-orange-200 bg-white px-4 py-3 text-sm font-bold text-orange-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
