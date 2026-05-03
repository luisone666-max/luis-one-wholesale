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
      <Link href={`/product/${product.slug}`} className="relative block aspect-square bg-gradient-to-br from-orange-50 via-white to-zinc-50 p-4">
        <ProductImage src={product.image} alt={product.name} className="transition duration-200 group-hover:scale-[1.03]" />
        <div className="absolute left-2 top-2">
          <StockStatusBadge status={product.stockStatus} />
        </div>
        <div className="absolute bottom-2 right-2 rounded-sm bg-white/95 px-2 py-1 text-[11px] font-black text-orange-700 shadow-sm">
          MOQ {product.moq}
        </div>
      </Link>
      <div className="space-y-2 p-2.5 sm:space-y-2.5 sm:p-3">
        <div>
          <Link href={`/product/${product.slug}`}>
            <h3 className="line-clamp-2 min-h-9 text-[13px] font-black leading-[18px] text-zinc-950 group-hover:text-orange-700 sm:min-h-10 sm:text-sm sm:leading-5">{product.name}</h3>
          </Link>
          <p className="mt-1 truncate text-xs font-bold text-zinc-500">{product.category}</p>
        </div>
        <div className="min-h-[42px] sm:min-h-[48px]">
          <p className="truncate text-[14px] font-black leading-5 text-[#f65f18] sm:text-base" title={getPriceRange(product)}>
            <span className="sm:hidden">{compactPrice}</span>
            <span className="hidden sm:inline">{getPriceRange(product)}</span>
          </p>
          <p className="mt-1 truncate text-[10px] font-bold leading-4 text-zinc-500 sm:text-[11px]">{bulkTier.label} from {formatMoney(bulkTier.price)}</p>
        </div>
        <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-zinc-500 sm:hidden">
          <span className="rounded-sm bg-orange-50 px-1.5 py-1 text-orange-700">MOQ {product.moq}</span>
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
