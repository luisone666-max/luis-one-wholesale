"use client";

import { useState } from "react";
import { MessengerIcon } from "@/components/BrandActionIcons";
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
  mobileLabel,
  className = "",
}: {
  product: ProductInquiryDetails;
  label?: string;
  mobileLabel?: string;
  className?: string;
}) {
  const [message, setMessage] = useState("");
  const [needsManualOpen, setNeedsManualOpen] = useState(false);

  const openInquiry = async () => {
    const messengerWindow = window.open(messengerUrl, "_blank", "noopener,noreferrer");
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
      setMessage(messengerWindow ? "Product details copied. Messenger opened in a new tab." : "Product details copied. Tap Open Messenger to continue.");
    } catch {
      setMessage(messengerWindow ? "Messenger opened in a new tab." : "Tap Open Messenger to continue.");
    }

    setNeedsManualOpen(!messengerWindow);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        aria-label={label}
        onClick={openInquiry}
        className={`inline-flex items-center justify-center gap-1.5 rounded-sm border border-[#cfeaff] bg-white px-3 text-xs font-black text-[#006aff] transition hover:bg-[#f1f8ff] ${className}`}
      >
        <MessengerIcon className="h-4 w-4 shrink-0" />
        <span className={mobileLabel ? "hidden sm:inline" : undefined}>{label}</span>
        {mobileLabel ? <span className="sm:hidden">{mobileLabel}</span> : null}
      </button>
      {message ? (
        <div className="text-[11px] font-bold leading-4 text-orange-700">
          <p>{message}</p>
          {needsManualOpen ? (
            <a href={messengerUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 font-black underline">
              <MessengerIcon className="h-3.5 w-3.5 shrink-0" />
              <span>Open Messenger</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
