"use client";

import { useState } from "react";
import { messengerUrl, ProductImage, StockStatusBadge } from "@/components/CustomerUi";
import { ProductInquiryButton } from "@/components/ProductInquiryButton";
import { addProductToCart } from "@/lib/customer-cart";
import { formatMoney, getPriceRange, getTierForQuantity, getVariantPriceRange, type Product, type ProductVariant } from "@/lib/mock-data";

function variantToProduct(product: Product, variant: ProductVariant): Product {
  return {
    ...product,
    sku: variant.sku || product.sku,
    image: variant.image || product.image,
    gallery: [variant.image || product.image, ...product.gallery].filter(Boolean),
    moq: variant.moq,
    stockStatus: variant.stockStatus,
    details: [
      variant.model ? `Model: ${variant.model}` : "",
      variant.fits ? `Fits: ${variant.fits}` : "",
      variant.leadTime ? `Lead time: ${variant.leadTime}` : "",
      ...product.details,
    ].filter(Boolean),
    tiers: variant.tiers.length ? variant.tiers : product.tiers,
  };
}

export function ProductDetailExperience({ product }: { product: Product }) {
  const activeVariants = product.variants?.filter((variant) => variant.active) ?? [];
  const [selectedVariantId, setSelectedVariantId] = useState(activeVariants[0]?.id ?? "");
  const selectedVariant = activeVariants.find((variant) => variant.id === selectedVariantId) ?? null;
  const displayProduct = selectedVariant ? variantToProduct(product, selectedVariant) : product;
  const [quantity, setQuantity] = useState(displayProduct.moq);
  const [message, setMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const appliedTier = getTierForQuantity(displayProduct, quantity);
  const subtotal = appliedTier.price * quantity;

  const selectVariant = (variant: ProductVariant) => {
    setSelectedVariantId(variant.id);
    setQuantity(Math.max(variant.moq, quantity));
    setMessage("");
  };

  const addToOrder = async () => {
    if (activeVariants.length && !selectedVariant) {
      setSuccess(false);
      setMessage("Please select a variant before adding this product.");
      return;
    }

    setLoading(true);
    const result = await addProductToCart(product.id, quantity, selectedVariant?.id ?? null);
    setLoading(false);
    setSuccess(result.ok);
    setMessage(result.message);
  };
  const shareBaseUrl = (
    process.env.NEXT_PUBLIC_PRODUCT_SHARE_URL ||
    "https://ifnkxkfjkdjicxpkrlxy.supabase.co/functions/v1/product-share"
  ).replace(/\/$/, "");
  const shareProductUrl = `${shareBaseUrl}?slug=${encodeURIComponent(product.slug)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareProductUrl)}`;
  const shareText = [
    "Luis One Supply Hub product:",
    product.name,
    `Price: ${selectedVariant ? getVariantPriceRange(selectedVariant) : getPriceRange(product)}`,
    `Link: ${shareProductUrl}`,
  ].join("\n");

  const shareToMessenger = async () => {
    try {
      await navigator.clipboard?.writeText(shareText);
      setShareMessage("Product link copied. Paste it in Messenger.");
    } catch {
      setShareMessage("Opening Messenger. Copy the product link from the browser if needed.");
    }

    window.open(messengerUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="overflow-hidden bg-white pb-20 shadow-sm sm:rounded-sm sm:border sm:border-zinc-200 sm:p-4">
      <div className="grid gap-3 lg:grid-cols-[430px_1fr] lg:gap-7">
        <div>
          <div className="aspect-square bg-white p-1.5 sm:rounded-sm sm:border sm:border-zinc-200 sm:p-3">
            <ProductImage src={displayProduct.image} alt={displayProduct.name} />
          </div>
          <div className="mx-3 mt-2 grid grid-cols-5 gap-1.5 sm:mx-0 sm:mt-3 sm:gap-2">
            {displayProduct.gallery.slice(0, 5).map((image) => (
              <button key={image} type="button" className="aspect-square rounded-sm border border-zinc-200 bg-white p-1 hover:border-orange-400 sm:p-1.5">
                <ProductImage src={image} alt={`${displayProduct.name} view`} />
              </button>
            ))}
          </div>
          <div className="mx-3 mt-3 flex items-center justify-between gap-3 border-t border-zinc-100 pt-2 text-xs font-bold text-zinc-500 sm:mx-0 sm:mt-4 sm:pt-3 sm:text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span>Share:</span>
              <button
                type="button"
                onClick={() => void shareToMessenger()}
                className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-black text-orange-700 hover:bg-orange-100"
              >
                Messenger
              </button>
              <a
                href={facebookShareUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 hover:bg-blue-100"
              >
                Facebook
              </a>
            </div>
            <span className="hidden sm:inline">Wholesale item</span>
          </div>
          {shareMessage ? <p className="mt-2 text-xs font-bold text-orange-700">{shareMessage}</p> : null}
        </div>

        <div className="min-w-0 px-3 pb-4 sm:px-0 sm:pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-sm bg-[#f65f18] px-2 py-1 text-xs font-black text-white">Wholesale</span>
            <StockStatusBadge status={displayProduct.stockStatus} />
          </div>

          <h1 className="mt-2 text-base font-black leading-snug text-zinc-950 sm:mt-3 sm:text-2xl lg:text-[26px]">{product.name}</h1>

          <div className="mt-3 rounded-sm bg-[#fafafa] px-3 py-2.5 sm:mt-4 sm:px-5 sm:py-4">
            {displayProduct.retailPrice ? (
              <p className="mb-1 text-xs font-bold text-zinc-500">
                Retail price: <span className="text-zinc-700">{formatMoney(displayProduct.retailPrice)}</span>
              </p>
            ) : null}
            <p className="text-base font-black text-[#f65f18] sm:text-3xl">
              {selectedVariant ? getVariantPriceRange(selectedVariant) : getPriceRange(product)}
            </p>
            <p className="mt-1 text-xs font-bold text-zinc-500">Public wholesale prices. Final order will be confirmed manually.</p>
          </div>

          <div className="mt-3 space-y-3 text-sm sm:mt-5 sm:space-y-4">
            <DetailRow label="SKU">
              <span className="font-bold text-zinc-900">{displayProduct.sku ?? "-"}</span>
            </DetailRow>
            <DetailRow label="Wholesale Tiers">
              <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                {displayProduct.tiers.map((tier) => (
                  <span key={tier.label} className="rounded-sm border border-orange-100 bg-orange-50 px-2 py-1 text-[11px] font-black text-orange-700 sm:px-3 sm:py-1.5 sm:text-xs">
                    {tier.label}: {formatMoney(tier.price)}
                  </span>
                ))}
              </div>
            </DetailRow>
            <DetailRow label="Shipping">
              <div>
                <p className="font-bold text-zinc-900">Pick-up / Lalamove / Courier</p>
                <p className="mt-1 text-xs font-bold text-zinc-500">Freight collect is not added to product total.</p>
              </div>
            </DetailRow>
            <DetailRow label="Guarantee">
              <p className="font-bold text-zinc-900">Manual confirmation before payment or pickup arrangement</p>
            </DetailRow>

            {activeVariants.length ? (
              <DetailRow label="Model">
                <div className="grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:max-h-52 sm:gap-2 xl:grid-cols-3">
                  {activeVariants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => selectVariant(variant)}
                      className={`min-h-10 rounded-sm border px-2 py-1.5 text-left text-[11px] font-bold transition sm:min-h-12 sm:px-3 sm:py-2 sm:text-xs ${
                        selectedVariantId === variant.id
                          ? "border-[#f65f18] bg-orange-50 text-orange-700"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-300"
                      }`}
                    >
                      <span className="line-clamp-1 block font-black">{variant.name}</span>
                      <span className="mt-0.5 line-clamp-1 block text-[10px] text-zinc-500 sm:text-[11px]">{variant.sku || variant.fits || "Variant"}</span>
                    </button>
                  ))}
                </div>
              </DetailRow>
            ) : null}

            <DetailRow label="Quantity">
              <div>
                <div className="flex w-40 overflow-hidden rounded-sm border border-zinc-300 bg-white">
                  <button type="button" onClick={() => setQuantity((current) => Math.max(displayProduct.moq, current - 1))} className="h-9 w-10 border-r border-zinc-200 text-lg font-black text-zinc-600">-</button>
                  <input
                    type="number"
                    min={displayProduct.moq}
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(displayProduct.moq, Number(event.target.value) || displayProduct.moq))}
                    className="h-9 min-w-0 flex-1 text-center text-sm font-black outline-none"
                  />
                  <button type="button" onClick={() => setQuantity((current) => current + 1)} className="h-9 w-10 border-l border-zinc-200 text-lg font-black text-zinc-600">+</button>
                </div>
                <p className="mt-1 text-xs font-bold text-zinc-500">MOQ {displayProduct.moq} pc. Applied tier: {appliedTier.label}</p>
              </div>
            </DetailRow>

            <DetailRow label="Subtotal">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-base font-black text-[#f65f18] sm:text-xl">{formatMoney(subtotal)}</span>
                <span className="text-xs font-bold text-zinc-500">Unit price: {formatMoney(appliedTier.price)}</span>
              </div>
            </DetailRow>
          </div>

          <div className="mt-4 hidden grid-cols-2 gap-2 border-t border-zinc-100 pt-3 sm:mt-6 sm:flex sm:gap-3 sm:pt-5">
            <button
              type="button"
              onClick={addToOrder}
              disabled={loading}
              className="h-11 rounded-sm border border-[#f65f18] bg-orange-50 px-3 text-xs font-black text-[#f65f18] transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:min-w-44 sm:px-8 sm:text-sm"
            >
              {loading ? "Adding..." : "Add to Order"}
            </button>
            <ProductInquiryButton product={displayProduct} label="Messenger" className="h-11 w-full !border-[#f65f18] !bg-[#f65f18] px-3 text-xs !text-white hover:!bg-[#df4f0d] sm:h-12 sm:min-w-44 sm:px-8 sm:text-sm" />
          </div>

          {message ? (
            <p className={`mt-3 rounded-sm border px-4 py-3 text-sm font-bold ${success ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-orange-200 bg-orange-50 text-orange-700"}`}>
              {message}
            </p>
          ) : null}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-zinc-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
        <button
          type="button"
          onClick={addToOrder}
          disabled={loading}
          className="h-11 rounded-sm border border-[#f65f18] bg-orange-50 px-3 text-xs font-black text-[#f65f18] transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add to Order"}
        </button>
        <ProductInquiryButton product={displayProduct} label="Messenger" className="h-11 w-full !border-[#f65f18] !bg-[#f65f18] px-3 text-xs !text-white" />
      </div>
    </section>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[86px_1fr] gap-2 sm:grid-cols-[118px_1fr] sm:gap-3">
      <div className="text-xs font-bold text-zinc-500 sm:text-sm">{label}</div>
      <div>{children}</div>
    </div>
  );
}
