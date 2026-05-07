"use client";

import { useState } from "react";
import { addProductToCart } from "@/lib/customer-cart";
import { notifyCustomerCartUpdated } from "@/lib/customer-cart-events";

export function AddToOrderButton({
  productId,
  quantity,
  className,
  compact,
}: {
  productId?: string;
  quantity: number;
  className?: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    setMessage("");
    const result = await addProductToCart(productId, quantity);
    setLoading(false);
    setSuccess(result.ok);
    setMessage(result.message);
    if (result.ok) {
      notifyCustomerCartUpdated();
    }
  };

  return (
    <div className={compact ? "space-y-2" : ""}>
      <button
        type="button"
        onClick={handleAdd}
        disabled={loading}
        className={
          className ??
          "h-11 w-full rounded-md bg-[#f65f18] px-4 text-sm font-black text-white transition hover:bg-[#df4f0d] disabled:cursor-not-allowed disabled:bg-orange-300"
        }
      >
        {loading ? "Adding..." : "Add to Order"}
      </button>
      {message ? (
        <p
          className={`rounded-md border px-3 py-2 text-xs font-bold leading-5 ${
            success ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-orange-200 bg-orange-50 text-orange-700"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
