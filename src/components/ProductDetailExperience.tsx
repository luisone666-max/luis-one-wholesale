"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CopyLinkIcon, FacebookIcon, MessengerIcon } from "@/components/BrandActionIcons";
import { messengerUrl, ProductImage, StockStatusBadge } from "@/components/CustomerUi";
import { trackMetaEvent } from "@/components/MetaPixel";
import { ProductInquiryButton } from "@/components/ProductInquiryButton";
import { businessInfo } from "@/lib/business-info";
import { addProductToCart } from "@/lib/customer-cart";
import { notifyCustomerCartUpdated } from "@/lib/customer-cart-events";
import { metaCatalogItemId } from "@/lib/meta-catalog";
import {
  formatMoney,
  getPriceRange,
  getTierForQuantity,
  getVariantPriceRange,
  isUnavailableStockStatus,
  type Product,
  type ProductVariant,
} from "@/lib/mock-data";

function variantToProduct(product: Product, variant: ProductVariant): Product {
  const gallery = variant.image ? [variant.image, ...product.gallery] : [];

  return {
    ...product,
    sku: variant.sku || product.sku,
    image: variant.image || "",
    gallery: Array.from(new Set(gallery.filter(Boolean))),
    moq: variant.moq,
    stockStatus: variant.stockStatus,
    variants: undefined,
    details: [
      variant.model ? `Model: ${variant.model}` : "",
      variant.fits ? `Fits: ${variant.fits}` : "",
      variant.leadTime ? `Lead time: ${variant.leadTime}` : "",
      ...product.details,
    ].filter(Boolean),
    tiers: variant.tiers.length ? variant.tiers : product.tiers,
  };
}

function toInquiryProduct(product: Product, priceRange: string) {
  return {
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    moq: product.moq,
    priceRange,
  };
}

function normalizeVariantSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/\bsparplug\b/g, "spark plug")
    .replace(/\bsparkplug\b/g, "spark plug")
    .replace(/\btubless\b/g, "tubeless")
    .replace(/\bn[\s-]?max\b/g, "nmax")
    .replace(/\bct\s*100\b/g, "ct100")
    .replace(/\bgd\s*110\b/g, "gd110")
    .replace(/\btmx\s*155\b/g, "tmx155")
    .replace(/\bxrm\s*125\b/g, "xrm125")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function ProductDetailExperience({ product }: { product: Product }) {
  const activeVariants = useMemo(() => product.variants?.filter((variant) => variant.active) ?? [], [product.variants]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [variantQuery, setVariantQuery] = useState("");
  const selectedVariant = activeVariants.find((variant) => variant.id === selectedVariantId) ?? null;
  const displayProduct = selectedVariant ? variantToProduct(product, selectedVariant) : product;
  const [quantity, setQuantity] = useState(displayProduct.moq);
  const [selectedImageOverride, setSelectedImageOverride] = useState("");
  const [message, setMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareNeedsManualOpen, setShareNeedsManualOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const appliedTier = getTierForQuantity(displayProduct, quantity);
  const quotationOnly = !appliedTier;
  const subtotal = appliedTier ? appliedTier.price * quantity : 0;
  const directOrderUnavailable = isUnavailableStockStatus(displayProduct.stockStatus) || quotationOnly;
  const selectedVariantImagePending = Boolean(selectedVariant && !selectedVariant.image);
  const displayPriceRange = selectedVariant ? getVariantPriceRange(selectedVariant) : getPriceRange(product);
  const inquiryProduct = toInquiryProduct(displayProduct, displayPriceRange);
  const galleryImages = useMemo(
    () => Array.from(new Set([displayProduct.image, ...displayProduct.gallery].filter(Boolean))).slice(0, 5),
    [displayProduct.gallery, displayProduct.image],
  );
  const selectedImage = selectedImageOverride && galleryImages.includes(selectedImageOverride) ? selectedImageOverride : displayProduct.image;
  const filteredVariants = useMemo(() => {
    const normalizedQuery = normalizeVariantSearch(variantQuery);
    const queryWords = normalizedQuery.split(" ").filter(Boolean);

    if (!queryWords.length) {
      return activeVariants;
    }

    return activeVariants.filter((variant) => {
      const haystack = normalizeVariantSearch([variant.name, variant.sku, variant.model, variant.fits].filter(Boolean).join(" "));
      return queryWords.every((word) => haystack.includes(word));
    });
  }, [activeVariants, variantQuery]);
  const trackedViewContentKey = useRef("");
  const viewContentKey = `${product.id}:${selectedVariant?.id ?? "product"}`;

  useEffect(() => {
    if (trackedViewContentKey.current === viewContentKey) {
      return;
    }

    trackedViewContentKey.current = viewContentKey;
    trackMetaEvent("ViewContent", {
      content_ids: [metaCatalogItemId(product, selectedVariant)],
      content_name: displayProduct.name,
      content_type: "product",
      currency: "PHP",
      value: appliedTier?.price ?? displayProduct.retailPrice ?? 0,
    });
  }, [
    appliedTier?.price,
    displayProduct.name,
    displayProduct.retailPrice,
    product,
    selectedVariant,
    viewContentKey,
  ]);

  const selectVariant = (variant: ProductVariant) => {
    setSelectedVariantId(variant.id);
    setQuantity(Math.max(variant.moq, quantity));
    setMessage("");
    setLoginRequired(false);
    setSelectedImageOverride("");
  };

  const addToOrder = async () => {
    setLoginRequired(false);

    if (activeVariants.length && !selectedVariant) {
      setSuccess(false);
      setMessage("Please select a variant before adding this product.");
      return;
    }

    if (directOrderUnavailable) {
      setSuccess(false);
      setMessage(
        quotationOnly
          ? "This item needs price confirmation before ordering. Please ask on Messenger so we can quote it."
          : "This item is currently unavailable for direct order. Please ask on Messenger so we can check stock or arrange a special order.",
      );
      return;
    }

    setLoading(true);
    const result = await addProductToCart(product.id, quantity, selectedVariant?.id ?? null);
    setLoading(false);
    setSuccess(result.ok);
    setLoginRequired(!result.ok && result.message === "Please login or register to place order.");
    setMessage(
      !result.ok && result.message === "Please login or register to place order."
        ? "Login required before adding this item to your order list."
        : result.message,
    );

    if (result.ok) {
      notifyCustomerCartUpdated();
      trackMetaEvent("AddToCart", {
        content_ids: [metaCatalogItemId(product, selectedVariant)],
        content_name: displayProduct.name,
        content_type: "product",
        currency: "PHP",
        value: subtotal,
      });
    }
  };
  const legacyShareBaseUrl = process.env.NEXT_PUBLIC_PRODUCT_SHARE_URL?.replace(/\/$/, "");
  const siteShareBaseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://luisonesupplyhub.com").replace(/\/$/, "");
  const shareProductUrl = legacyShareBaseUrl
    ? `${legacyShareBaseUrl}?slug=${encodeURIComponent(product.slug)}`
    : `${siteShareBaseUrl}/share/product/${encodeURIComponent(product.slug)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareProductUrl)}`;
  const shareText = [
    "Luis One Supply Hub product:",
    product.name,
    `Price: ${selectedVariant ? getVariantPriceRange(selectedVariant) : getPriceRange(product)}`,
    `Link: ${shareProductUrl}`,
  ].join("\n");
  const loginRedirectPath = `/product/${product.slug}`;
  const loginHref = `/login?redirect=${encodeURIComponent(loginRedirectPath)}`;

  const shareToMessenger = async () => {
    const messengerWindow = window.open(messengerUrl, "_blank", "noopener,noreferrer");

    try {
      await navigator.clipboard?.writeText(shareText);
      setShareMessage(messengerWindow ? "Product link copied. Messenger opened in a new tab." : "Product link copied. Tap Open Messenger to continue.");
    } catch {
      setShareMessage(messengerWindow ? "Messenger opened in a new tab. Copy the product link from the browser if needed." : "Tap Open Messenger to continue.");
    }

    setShareNeedsManualOpen(!messengerWindow);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard?.writeText(shareProductUrl);
      setShareMessage("Product share link copied.");
      setShareNeedsManualOpen(false);
    } catch {
      setShareMessage("Copy failed. Please copy the link from your browser.");
      setShareNeedsManualOpen(false);
    }
  };

  const trackFacebookShare = () => {
    trackMetaEvent("Share", {
      content_name: product.name,
      content_type: "product",
    });
  };

  return (
    <section className="overflow-hidden bg-white pb-28 shadow-sm sm:rounded-sm sm:border sm:border-zinc-200 sm:p-4 lg:pb-4">
      <div className="grid gap-3 md:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)] md:gap-5 lg:grid-cols-[430px_1fr] lg:gap-7">
        <div>
          <div className="aspect-[4/3] bg-white p-1.5 sm:rounded-sm sm:border sm:border-zinc-200 sm:p-3 md:aspect-square">
            <ProductImage src={selectedImage || displayProduct.image} alt={displayProduct.name} />
          </div>
          {selectedVariantImagePending ? (
            <p className="mx-3 mt-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 sm:mx-0">
              Variant image is pending. We can update this model image later.
            </p>
          ) : null}
          <div className="mx-3 mt-2 grid grid-cols-5 gap-1.5 sm:mx-0 sm:mt-3 sm:gap-2">
            {galleryImages.map((image, index) => (
              <button
                key={image}
                type="button"
                aria-label={`Show product image ${index + 1}`}
                onClick={() => setSelectedImageOverride(image)}
                className={`aspect-square rounded-sm border bg-white p-1 hover:border-orange-400 sm:p-1.5 ${
                  selectedImage === image ? "border-[#f65f18] ring-2 ring-orange-100" : "border-zinc-200"
                }`}
              >
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
                className="inline-flex items-center gap-1.5 rounded-full border border-[#cfeaff] bg-[#f1f8ff] px-3 py-1 text-xs font-black text-[#006aff] hover:bg-[#e5f3ff]"
              >
                <MessengerIcon className="h-4 w-4 shrink-0" />
                <span>Messenger</span>
              </button>
              <a
                href={facebookShareUrl}
                target="_blank"
                rel="noreferrer"
                onClick={trackFacebookShare}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe0ff] bg-[#f1f6ff] px-3 py-1 text-xs font-black text-[#1877f2] hover:bg-[#e8f1ff]"
              >
                <FacebookIcon className="h-4 w-4 shrink-0" />
                <span>Facebook</span>
              </a>
              <button
                type="button"
                onClick={() => void copyShareLink()}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-black text-zinc-700 hover:border-orange-200 hover:text-orange-700"
              >
                <CopyLinkIcon className="h-4 w-4 shrink-0" />
                <span>Copy Link</span>
              </button>
            </div>
            <span className="hidden sm:inline">Wholesale item</span>
          </div>
          {shareMessage ? (
            <div className="mt-2 text-xs font-bold text-orange-700">
              <p>{shareMessage}</p>
              {shareNeedsManualOpen ? (
                <a href={messengerUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 font-black underline">
                  <MessengerIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>Open Messenger</span>
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 px-3 pb-4 sm:px-0 sm:pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-sm bg-[#f65f18] px-2 py-1 text-xs font-black text-white">Wholesale</span>
            <StockStatusBadge status={displayProduct.stockStatus} />
          </div>
          {directOrderUnavailable ? (
            <div className="mt-3 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">
              {quotationOnly
                ? "This item needs price confirmation. Please use Messenger so we can quote the current price."
                : "This item is shown for inquiry only. Please use Messenger to check availability, color, lead time, or special order options."}
            </div>
          ) : null}

          <h1 className="mt-2 text-base font-black leading-snug text-zinc-950 sm:mt-3 sm:text-2xl lg:text-[26px]">{product.name}</h1>

          <div className="mt-3 rounded-sm bg-[#fafafa] px-3 py-2.5 sm:mt-4 sm:px-5 sm:py-4">
            {displayProduct.retailPrice ? (
              <p className="mb-1 text-xs font-bold text-zinc-500">
                Retail price: <span className="text-zinc-700">{formatMoney(displayProduct.retailPrice)}</span>
              </p>
            ) : null}
            <p className="text-base font-black text-[#f65f18] sm:text-3xl">
              {displayPriceRange}
            </p>
            <p className="mt-1 text-xs font-bold text-zinc-500">Public wholesale prices. Final order will be confirmed manually.</p>
          </div>

          <div className="mt-2 grid gap-2 text-xs font-bold sm:grid-cols-3">
            <InfoBadge label="J&T COD" value="Available after stock confirmation" tone="green" />
            <InfoBadge label="Ships From" value="Luis One, Tondo Manila" tone="orange" />
            <InfoBadge label="Pickup" value="Store pickup and Lalamove supported" tone="blue" />
          </div>

          <div className="mt-3 space-y-3 text-sm sm:mt-5 sm:space-y-4">
            <DetailRow label="SKU">
              <span className="font-bold text-zinc-900">{displayProduct.sku ?? "-"}</span>
            </DetailRow>
            <DetailRow label="Wholesale Tiers">
              {displayProduct.tiers.length ? (
                <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                  {displayProduct.tiers.map((tier) => (
                    <span key={tier.label} className="rounded-sm border border-orange-100 bg-orange-50 px-2 py-1 text-[11px] font-black text-orange-700 sm:px-3 sm:py-1.5 sm:text-xs">
                      {tier.label}: {formatMoney(tier.price)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                  Contact us for quotation.
                </p>
              )}
            </DetailRow>
            <DetailRow label="Shipping">
              <div>
                <p className="font-bold text-zinc-900">J&T Express COD / Store Pickup / Lalamove</p>
                <p className="mt-1 text-xs font-bold text-zinc-500">
                  Ships from {businessInfo.address}. Choose your receiving method at checkout. J&T Express COD can include estimated shipping when available.
                </p>
              </div>
            </DetailRow>
            <DetailRow label="Guarantee">
              <p className="font-bold text-zinc-900">Manual confirmation before payment or pickup arrangement</p>
            </DetailRow>

            {activeVariants.length ? (
              <DetailRow label="Options">
                <div>
                  {activeVariants.length > 8 ? (
                    <div className="mb-2 grid gap-1.5 sm:grid-cols-[1fr_auto] sm:items-center">
                      <input
                        aria-label="Search product options"
                        value={variantQuery}
                        onChange={(event) => setVariantQuery(event.target.value)}
                        placeholder="Search model, color, size, SKU"
                        className="h-9 min-w-0 rounded-sm border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-800 outline-none focus:border-[#f65f18]"
                      />
                      <span className="text-[11px] font-bold text-zinc-500">
                        {filteredVariants.length}/{activeVariants.length} options
                      </span>
                    </div>
                  ) : null}

                  <div className="grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:max-h-52 sm:gap-2 xl:grid-cols-3">
                    {filteredVariants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => selectVariant(variant)}
                        className={`grid min-h-12 grid-cols-[34px_1fr] items-center gap-2 rounded-sm border px-2 py-1.5 text-left text-[11px] font-bold transition sm:min-h-14 sm:grid-cols-[42px_1fr] sm:px-3 sm:py-2 sm:text-xs ${
                          selectedVariantId === variant.id
                            ? "border-[#f65f18] bg-orange-50 text-orange-700"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-300"
                        }`}
                      >
                        <span className="grid aspect-square place-items-center overflow-hidden rounded-sm border border-zinc-200 bg-zinc-50 text-[9px] font-black text-zinc-400">
                          {variant.image ? <ProductImage src={variant.image} alt={variant.name} /> : "No img"}
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-1 block font-black">{variant.name}</span>
                          <span className="mt-0.5 line-clamp-1 block text-[10px] text-zinc-500 sm:text-[11px]">{variant.sku || variant.fits || "Variant"}</span>
                          {isUnavailableStockStatus(variant.stockStatus) ? (
                            <span className="mt-0.5 block text-[10px] font-black text-zinc-500">Messenger inquiry only</span>
                          ) : null}
                        </span>
                      </button>
                    ))}
                  </div>
                  {!filteredVariants.length ? (
                    <p className="rounded-sm border border-dashed border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700">
                      No matching option. Try model code, color, size, or SKU.
                    </p>
                  ) : null}
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
                <p className="mt-1 text-xs font-bold text-zinc-500">MOQ {displayProduct.moq} pc. Applied tier: {appliedTier?.label ?? "Quotation required"}</p>
              </div>
            </DetailRow>

            <DetailRow label="Subtotal">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-base font-black text-[#f65f18] sm:text-xl">{appliedTier ? formatMoney(subtotal) : "Contact for quotation"}</span>
                <span className="text-xs font-bold text-zinc-500">Unit price: {appliedTier ? formatMoney(appliedTier.price) : "To be confirmed"}</span>
              </div>
            </DetailRow>
          </div>

          <div className="mt-4 hidden grid-cols-2 gap-2 border-t border-zinc-100 pt-3 sm:mt-6 lg:flex lg:gap-3 lg:pt-5">
            {directOrderUnavailable ? (
              <ProductInquiryButton product={inquiryProduct} label={quotationOnly ? "Ask Price on Messenger" : "Ask Availability on Messenger"} className="h-11 w-full !border-[#f65f18] !bg-[#f65f18] px-4 text-xs !text-white hover:!bg-[#df4f0d] sm:h-12 sm:min-w-72 sm:px-8 sm:text-sm" />
            ) : (
              <>
                <button
                  type="button"
                  onClick={addToOrder}
                  disabled={loading}
                  className="h-11 rounded-sm border border-[#f65f18] bg-orange-50 px-3 text-xs font-black text-[#f65f18] transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:min-w-44 sm:px-8 sm:text-sm"
                >
                  {loading ? "Adding..." : "Add to Order"}
                </button>
                <ProductInquiryButton product={inquiryProduct} label="Messenger" className="h-11 w-full !border-[#f65f18] !bg-[#f65f18] px-3 text-xs !text-white hover:!bg-[#df4f0d] sm:h-12 sm:min-w-44 sm:px-8 sm:text-sm" />
              </>
            )}
          </div>

          {message ? (
            <div className={`mt-3 rounded-sm border px-4 py-3 text-sm font-bold ${success ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-orange-200 bg-orange-50 text-orange-700"}`}>
              <p>{message}</p>
              {loginRequired ? (
                <div className="mt-3 grid gap-2 sm:flex">
                  <Link href={loginHref} className="inline-flex h-10 items-center justify-center rounded-sm bg-[#f65f18] px-4 text-xs font-black text-white hover:bg-[#df4f0d]">
                    Login to Order
                  </Link>
                  <Link href="/register" className="inline-flex h-10 items-center justify-center rounded-sm border border-orange-200 bg-white px-4 text-xs font-black text-orange-700 hover:bg-orange-50">
                    Register Account
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-[0.9fr_1.1fr_1fr] gap-2 border-t border-zinc-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
        {directOrderUnavailable ? (
          <div className="col-span-3">
            <ProductInquiryButton product={inquiryProduct} label={quotationOnly ? "Ask Price on Messenger" : "Ask Availability on Messenger"} className="h-11 w-full !border-[#f65f18] !bg-[#f65f18] px-3 text-xs !text-white" />
          </div>
        ) : (
          <>
            <ProductInquiryButton product={inquiryProduct} label="Chat" ariaLabel="Chat on Messenger" className="h-11 w-full px-2 text-xs" />
            <button
              type="button"
              onClick={addToOrder}
              disabled={loading}
              className="h-11 rounded-sm border border-[#f65f18] bg-[#ff7a1a] px-2 text-xs font-black text-white transition hover:bg-[#f65f18] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add Order"}
            </button>
            <Link href="/cart" className="inline-flex h-11 items-center justify-center rounded-sm bg-[#f65f18] px-2 text-xs font-black text-white transition hover:bg-[#df4f0d]">
              Order List
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

function InfoBadge({ label, value, tone }: { label: string; value: string; tone: "green" | "orange" | "blue" }) {
  const toneClass = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    blue: "border-zinc-200 bg-zinc-50 text-zinc-800",
  }[tone];

  return (
    <div className={`rounded-sm border px-3 py-2 ${toneClass}`}>
      <p className="font-black">{label}</p>
      <p className="mt-0.5 leading-4 opacity-80">{value}</p>
    </div>
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
