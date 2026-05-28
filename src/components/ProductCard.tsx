import Link from "next/link";
import { ViewDetailsIcon } from "@/components/BrandActionIcons";
import { ProductImage, StockStatusBadge } from "@/components/CustomerUi";
import { ProductInquiryButton } from "@/components/ProductInquiryButton";
import {
  formatMoney,
  getPriceRange,
  getProductBulkHintTier,
  getProductPriceTiers,
  isUnavailableStockStatus,
  type Product,
} from "@/lib/mock-data";

function formatMobileMoney(value: number) {
  return `PHP ${value.toLocaleString("en-US", { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
}

function formatCardMoney(value: number, includeCurrency = true) {
  const amount = value.toLocaleString("en-US", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });

  return includeCurrency ? `PHP ${amount}` : amount;
}

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const bulkTier = getProductBulkHintTier(product);
  const prices = getProductPriceTiers(product).map((tier) => tier.price);
  const hasPrice = prices.length > 0;
  const minPrice = hasPrice ? Math.min(...prices) : null;
  const maxPrice = hasPrice ? Math.max(...prices) : null;
  const compactPrice = minPrice ? `${formatMobileMoney(minPrice)}+` : "Quote";
  const cardPrice =
    minPrice !== null && maxPrice !== null
      ? minPrice === maxPrice
        ? formatCardMoney(minPrice)
        : `${formatCardMoney(minPrice)} - ${formatCardMoney(maxPrice, false)}`
      : "Contact for quote";
  const unavailable = isUnavailableStockStatus(product.stockStatus);
  const stockLabel = product.stockStatus === "In stock" ? "Ready" : product.stockStatus === "Preorder" ? "Order" : product.stockStatus;
  const productHref = `/product/${product.slug}`;
  const priceRange = getPriceRange(product);
  const variantCount = product.optionCount ?? product.variants?.filter((variant) => variant.active).length ?? 0;
  const inquiryProduct = {
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    moq: product.moq,
    priceRange,
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg [contain-intrinsic-size:240px_390px] [content-visibility:auto]">
      <Link href={productHref} className="block">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-orange-50 via-white to-zinc-50 p-2 sm:p-4">
          <ProductImage src={product.image} alt={product.name} priority={priority} quality={62} className="transition duration-200 group-hover:scale-[1.03]" />
          <div className="absolute left-2 top-2 [&>span]:px-2 [&>span]:py-0.5 [&>span]:text-[9px] sm:[&>span]:text-[11px]">
            <StockStatusBadge status={product.stockStatus} />
          </div>
          <div className="absolute bottom-2 right-2 rounded-sm bg-white/95 px-2 py-1 text-[9px] font-black text-orange-700 shadow-sm ring-1 ring-orange-100 sm:text-[11px]">
            MOQ {product.moq}
          </div>
        </div>

        <div className="space-y-1.5 p-2.5 sm:space-y-2.5 sm:p-3.5">
          <div>
            <h3 className="line-clamp-2 min-h-[32px] text-[11px] font-black leading-4 text-zinc-950 group-hover:text-orange-700 sm:min-h-10 sm:text-sm sm:leading-5">{product.name}</h3>
            <p className="mt-1 truncate text-[10px] font-bold text-zinc-500 sm:text-xs">
              {variantCount > 1 ? `${variantCount} options` : product.category}
            </p>
          </div>
          <div className="min-h-[45px] sm:min-h-[54px]">
            {product.retailPrice ? (
              <p className="truncate text-[9px] font-bold leading-3 text-zinc-400 sm:text-[11px]">
                <span className="sm:hidden">Retail {formatMobileMoney(product.retailPrice)}</span>
                <span className="hidden sm:inline">Retail {formatMoney(product.retailPrice)}</span>
              </p>
            ) : null}
            <p className="max-w-full truncate text-[12px] font-black leading-5 text-[#f65f18] sm:text-[15px]" title={priceRange}>
              <span className="sm:hidden">{compactPrice}</span>
              <span className="hidden sm:inline">{cardPrice}</span>
            </p>
            <p className="mt-0.5 truncate text-[9px] font-bold leading-3 text-zinc-500 sm:mt-1 sm:text-[11px] sm:leading-4">
              {!hasPrice ? (
                "Ask on Messenger for price"
              ) : unavailable ? (
                "Ask on Messenger for availability"
              ) : (
                <>
                  <span className="sm:hidden">{bulkTier?.label} from {formatMobileMoney(bulkTier?.price ?? 0)}</span>
                  <span className="hidden sm:inline">{bulkTier?.label} from {formatMoney(bulkTier?.price ?? 0)}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center justify-between gap-1 text-[9px] font-bold text-zinc-500 sm:hidden">
            <span className="rounded-sm bg-orange-50 px-1.5 py-0.5 text-orange-700">MOQ {product.moq}</span>
            <span className="truncate">{variantCount > 1 ? `${variantCount} options` : stockLabel}</span>
          </div>
        </div>
      </Link>

      <div className="mt-auto grid grid-cols-2 gap-1.5 border-t border-zinc-100 bg-zinc-50 p-2 sm:gap-2 sm:p-3">
        <Link href={productHref} aria-label={`View details for ${product.name}`} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-2 text-[10px] font-black leading-3 text-zinc-700 hover:border-orange-200 hover:text-orange-700 sm:h-9 sm:text-xs">
          <ViewDetailsIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          <span>Details</span>
        </Link>
        <ProductInquiryButton product={inquiryProduct} label="Chat" ariaLabel="Chat on Messenger" className="h-8 w-full gap-1.5 px-2 text-[10px] sm:h-9 sm:text-xs [&>svg]:h-3.5 [&>svg]:w-3.5 sm:[&>svg]:h-4 sm:[&>svg]:w-4" />
      </div>
    </article>
  );
}
