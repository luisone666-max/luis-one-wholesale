import Image from "next/image";
import Link from "next/link";
import { formatMoney, getPriceRange, Product } from "@/lib/mock-data";

export function ProductCard({ product }: { product: Product }) {
  const bulkTier = product.tiers[product.tiers.length - 1];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
    >
      <div className="aspect-square bg-[#fff5ef] p-4">
        <Image src={product.image} alt={product.name} width={420} height={420} className="h-full w-full object-contain" />
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-2 min-h-11 text-sm font-bold leading-5 text-zinc-900 group-hover:text-orange-700">
            {product.name}
          </h3>
          <p className="mt-1 text-xs font-medium text-zinc-500">{product.category}</p>
        </div>
        <div>
          <p className="text-lg font-black text-[#f65f18]">{getPriceRange(product)}</p>
          <p className="mt-1 text-xs text-zinc-500">MOQ {product.moq} pc · {bulkTier.label} from {formatMoney(bulkTier.price)}</p>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="rounded bg-orange-50 px-2 py-1 font-bold text-orange-700">Tier pricing</span>
          <span className={product.stockStatus === "Low stock" ? "font-bold text-amber-600" : "font-bold text-emerald-600"}>
            {product.stockStatus}
          </span>
        </div>
      </div>
    </Link>
  );
}
