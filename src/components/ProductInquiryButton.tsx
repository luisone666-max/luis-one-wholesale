"use client";

import { useState } from "react";
import { messengerUrl } from "@/components/CustomerUi";

export type ProductInquiryDetails = {
  slug: string;
  name: string;
  sku?: string;
  moq: number;
  priceRange: string;
};

export function ProductInquiryButton({
  product,
  label = "Messenger",
  className = "",
}: {
  product: ProductInquiryDetails;
  label?: string;
  className?: string;
}) {
  const [message, setMessage] = useState("");

  const openInquiry = async () => {
    const productLink = `${window.location.origin}/product/${product.slug}`;
    const inquiry = [
      "Hi, I want to inquire about this product:",
      `Product: ${product.name}`,
      `SKU: ${product.sku ?? "-"}`,
      `Price: ${product.priceRange}`,
      `MOQ: ${product.moq}`,
      `Link: ${productLink}`,
    ].join("\n");

    try {
      await navigator.clipboard?.writeText(inquiry);
      setMessage("Product details copied. Opening Messenger...");
    } catch {
      setMessage("Opening Messenger...");
    }

    window.open(messengerUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openInquiry}
        className={`inline-flex items-center justify-center rounded-sm border border-orange-200 bg-white px-3 text-xs font-black text-orange-700 transition hover:bg-orange-50 ${className}`}
      >
        {label}
      </button>
      {message ? <p className="text-[11px] font-bold leading-4 text-orange-700">{message}</p> : null}
    </div>
  );
}
