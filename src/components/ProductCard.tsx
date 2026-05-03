import Link from "next/link";
import { ProductImage, StockStatusBadge } from "@/components/CustomerUi";
import { ProductInquiryButton } from "@/components/ProductInquiryButton";
import { formatMoney, getPriceRange, type Product } from "@/lib/mock-data";

export function ProductCard({ product }: { product: Product }) {
  const bulkTier = product.tiers.find((tier) => tier.min >= 6) ?? product.tiers[product.tiers.length - 1];

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
      <div className="space-y-2.5 p-3">
        <div>
          <Link href={`/product/${product.slug}`}>
            <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-zinc-950 group-hover:text-orange-700">{product.name}</h3>
          </Link>
          <p className="mt-1 truncate text-xs font-bold text-zinc-500">{product.category}</p>
        </div>
        <div className="min-h-[52px]">
          <p className="line-clamp-1 text-[15px] font-black leading-5 text-[#f65f18] sm:text-base">{getPriceRange(product)}</p>
          <p className="mt-1 line-clamp-1 text-[11px] font-bold leading-4 text-zinc-500">{bulkTier.label} from {formatMoney(bulkTier.price)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/product/${product.slug}`} className="grid h-10 place-items-center rounded-sm border border-zinc-200 text-xs font-black text-zinc-700 hover:border-orange-200 hover:text-orange-700">
            View Details
          </Link>
          <ProductInquiryButton product={product} className="h-10 w-full" />
        </div>
      </div>
    </article>
  );
}
