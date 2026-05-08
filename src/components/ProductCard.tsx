import Link from "next/link";
import { ProductImage, StockStatusBadge } from "@/components/CustomerUi";
import { ProductInquiryButton } from "@/components/ProductInquiryButton";
import { formatMoney, getPriceRange, isUnavailableStockStatus, type Product } from "@/lib/mock-data";

function formatMobileMoney(value: number) {
  return `PHP ${value.toLocaleString("en-US", { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
}

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const bulkTier = product.tiers.find((tier) => tier.min >= 6) ?? product.tiers[product.tiers.length - 1];
  const prices = product.tiers.map((tier) => tier.price);
  const compactPrice = `${formatMobileMoney(Math.min(...prices))}+`;
  const unavailable = isUnavailableStockStatus(product.stockStatus);
  const stockLabel = product.stockStatus === "In stock" ? "Ready" : product.stockStatus === "Preorder" ? "Order" : product.stockStatus;
  const productHref = `/product/${product.slug}`;

  return (
    <article className="group overflow-hidden rounded-sm border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md">
      <Link href={productHref} className="block">
        <div className="relative aspect-square bg-gradient-to-br from-orange-50 via-white to-zinc-50 p-0 sm:p-4">
          <ProductImage src={product.image} alt={product.name} priority={priority} className="transition duration-200 group-hover:scale-[1.03]" />
          <div className="absolute left-1 top-1 [&>span]:px-1.5 [&>span]:py-0.5 [&>span]:text-[8px] sm:left-2 sm:top-2 sm:[&>span]:px-2 sm:[&>span]:py-1 sm:[&>span]:text-[11px]">
            <StockStatusBadge status={product.stockStatus} />
          </div>
          <div className="absolute bottom-1 right-1 rounded-sm bg-white/95 px-1.5 py-0.5 text-[8px] font-black text-orange-700 shadow-sm sm:bottom-2 sm:right-2 sm:px-2 sm:py-1 sm:text-[11px]">
            MOQ {product.moq}
          </div>
        </div>

        <div className="space-y-0.5 p-1.5 sm:space-y-2.5 sm:p-3">
          <div>
            <h3 className="line-clamp-2 min-h-[30px] text-[10px] font-black leading-[15px] text-zinc-950 group-hover:text-orange-700 sm:min-h-10 sm:text-sm sm:leading-5">{product.name}</h3>
            <p className="mt-1 hidden truncate text-xs font-bold text-zinc-500 sm:block">{product.category}</p>
          </div>
          <div className="min-h-[34px] sm:min-h-[48px]">
            {product.retailPrice ? (
              <p className="truncate text-[8px] font-bold leading-[11px] text-zinc-400 sm:text-[11px]">
                <span className="sm:hidden">Retail {formatMobileMoney(product.retailPrice)}</span>
                <span className="hidden sm:inline">Retail {formatMoney(product.retailPrice)}</span>
              </p>
            ) : null}
            <p className="max-w-full truncate text-[10px] font-black leading-4 text-[#f65f18] sm:text-base sm:leading-5" title={getPriceRange(product)}>
              <span className="sm:hidden">{compactPrice}</span>
              <span className="hidden sm:inline">{getPriceRange(product)}</span>
            </p>
            <p className="mt-0.5 truncate text-[8px] font-bold leading-3 text-zinc-500 sm:mt-1 sm:text-[11px] sm:leading-4">
              {unavailable ? (
                "Ask on Messenger for availability"
              ) : (
                <>
                  <span className="sm:hidden">{bulkTier.label} from {formatMobileMoney(bulkTier.price)}</span>
                  <span className="hidden sm:inline">{bulkTier.label} from {formatMoney(bulkTier.price)}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center justify-between gap-1 text-[8px] font-bold text-zinc-500 sm:hidden">
            <span className="rounded-sm bg-orange-50 px-1.5 py-0.5 text-orange-700">MOQ {product.moq}</span>
            <span className="truncate">{stockLabel}</span>
          </div>
        </div>
      </Link>

      <div className="hidden gap-1.5 p-3 pt-0 sm:grid sm:grid-cols-2 sm:gap-2">
        <Link href={productHref} className="grid h-9 place-items-center rounded-sm border border-zinc-200 px-2 text-[11px] font-black leading-3 text-zinc-700 hover:border-orange-200 hover:text-orange-700 sm:h-10 sm:text-xs">
          View Details
        </Link>
        <ProductInquiryButton product={product} className="h-9 w-full px-2 text-[11px] sm:h-10 sm:text-xs" />
      </div>
    </article>
  );
}
