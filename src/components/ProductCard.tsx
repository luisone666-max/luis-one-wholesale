import Link from "next/link";
import { ProductImage, StockStatusBadge } from "@/components/CustomerUi";
import { ProductInquiryButton } from "@/components/ProductInquiryButton";
import { formatMoney, getPriceRange, type Product } from "@/lib/mock-data";

export function ProductCard({ product }: { product: Product }) {
  const bulkTier = product.tiers.find((tier) => tier.min >= 6) ?? product.tiers[product.tiers.length - 1];
  const prices = product.tiers.map((tier) => tier.price);
  const compactPrice = `${formatMoney(Math.min(...prices))}+`;

  return (
    <article className="group overflow-hidden rounded-sm border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square bg-gradient-to-br from-orange-50 via-white to-zinc-50 p-1.5 sm:p-4">
        <ProductImage src={product.image} alt={product.name} className="transition duration-200 group-hover:scale-[1.03]" />
        <div className="absolute left-1.5 top-1.5 [&>span]:px-1.5 [&>span]:py-0.5 [&>span]:text-[9px] sm:left-2 sm:top-2 sm:[&>span]:px-2 sm:[&>span]:py-1 sm:[&>span]:text-[11px]">
          <StockStatusBadge status={product.stockStatus} />
        </div>
        <div className="absolute bottom-1.5 right-1.5 rounded-sm bg-white/95 px-1.5 py-0.5 text-[9px] font-black text-orange-700 shadow-sm sm:bottom-2 sm:right-2 sm:px-2 sm:py-1 sm:text-[11px]">
          MOQ {product.moq}
        </div>
      </Link>
      <div className="space-y-1.5 p-2 sm:space-y-2.5 sm:p-3">
        <div>
          <Link href={`/product/${product.slug}`}>
            <h3 className="line-clamp-2 min-h-8 text-[12px] font-black leading-4 text-zinc-950 group-hover:text-orange-700 sm:min-h-10 sm:text-sm sm:leading-5">{product.name}</h3>
          </Link>
          <p className="mt-1 hidden truncate text-xs font-bold text-zinc-500 sm:block">{product.category}</p>
        </div>
        <div className="min-h-[34px] sm:min-h-[48px]">
          {product.retailPrice ? (
            <p className="truncate text-[9px] font-bold leading-3 text-zinc-400 sm:text-[11px]">
              Retail {formatMoney(product.retailPrice)}
            </p>
          ) : null}
          <p className="truncate text-[12px] font-black leading-4 text-[#f65f18] sm:text-base sm:leading-5" title={getPriceRange(product)}>
            <span className="sm:hidden">{compactPrice}</span>
            <span className="hidden sm:inline">{getPriceRange(product)}</span>
          </p>
          <p className="mt-0.5 truncate text-[9px] font-bold leading-3 text-zinc-500 sm:mt-1 sm:text-[11px] sm:leading-4">{bulkTier.label} from {formatMoney(bulkTier.price)}</p>
        </div>
        <div className="flex items-center justify-between gap-1 text-[9px] font-bold text-zinc-500 sm:hidden">
          <span className="rounded-sm bg-orange-50 px-1.5 py-0.5 text-orange-700">MOQ {product.moq}</span>
          <span className="truncate">{product.stockStatus === "In stock" ? "Ready Stock" : product.stockStatus === "Preorder" ? "For Order" : product.stockStatus}</span>
        </div>
        <div className="hidden gap-1.5 sm:grid sm:grid-cols-2 sm:gap-2">
          <Link href={`/product/${product.slug}`} className="grid h-9 place-items-center rounded-sm border border-zinc-200 px-2 text-[11px] font-black leading-3 text-zinc-700 hover:border-orange-200 hover:text-orange-700 sm:h-10 sm:text-xs">
            View Details
          </Link>
          <ProductInquiryButton product={product} className="h-9 w-full px-2 text-[11px] sm:h-10 sm:text-xs" />
        </div>
      </div>
    </article>
  );
}
