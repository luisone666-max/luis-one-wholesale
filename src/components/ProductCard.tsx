import Link from "next/link";
import { ProductImage } from "@/components/CustomerUi";
import {
  getProductBulkHintTier,
  getProductPriceTiers,
  type Product,
} from "@/lib/mock-data";

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
  const cardPrice =
    minPrice !== null && maxPrice !== null
      ? minPrice === maxPrice
        ? formatCardMoney(minPrice)
        : `${formatCardMoney(minPrice)} - ${formatCardMoney(maxPrice, false)}`
      : "Ask for quote";
  const mobilePrice = minPrice !== null ? `${formatCardMoney(minPrice)}+` : "Ask for quote";
  const variantCount = product.optionCount ?? product.variants?.filter((variant) => variant.active).length ?? 0;
  const productHref = `/product/${product.slug}`;
  const detailLine = variantCount > 1 ? `${variantCount} options` : product.category;
  const stockLabel =
    product.stockStatus === "Unavailable"
      ? "Ask availability"
      : product.stockStatus === "Preorder"
        ? "Preorder"
        : "Ready";

  return (
    <Link
      href={productHref}
      aria-label={`View ${product.name}`}
      className="group block overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md [contain-intrinsic-size:220px_330px] [content-visibility:auto]"
    >
      <article>
        <div className="relative aspect-square bg-white p-2.5 sm:p-3">
          <ProductImage
            src={product.image}
            alt={product.name}
            priority={priority}
            quality={68}
            className="transition duration-200 group-hover:scale-[1.025]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          />
          {product.stockStatus === "Unavailable" ? (
            <span className="absolute left-2 top-2 rounded-sm bg-white/95 px-2 py-1 text-[10px] font-black text-zinc-600 shadow-sm ring-1 ring-zinc-200">
              Inquiry
            </span>
          ) : null}
        </div>

        <div className="p-2.5 sm:p-3">
          <h3 className="line-clamp-2 min-h-[36px] text-[12px] font-bold leading-[18px] text-zinc-950 group-hover:text-orange-700 sm:min-h-10 sm:text-sm sm:leading-5">
            {product.name}
          </h3>

          <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-zinc-500 sm:text-[11px]">
            {detailLine}
          </p>

          <p className="mt-1.5 truncate text-[15px] font-black leading-5 text-[#f65f18] sm:text-lg" title={cardPrice}>
            <span className="sm:hidden">{mobilePrice}</span>
            <span className="hidden sm:inline">{cardPrice}</span>
          </p>

          <div className="mt-2 flex min-h-4 items-center justify-between gap-2 text-[10px] font-semibold text-zinc-500 sm:text-[11px]">
            <span className="truncate">Official Store</span>
            <span className="shrink-0 text-zinc-400">Manila</span>
          </div>

          <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-bold text-zinc-500 sm:text-[11px]">
            <span className="truncate">MOQ {product.moq}</span>
            <span className="truncate text-right">
              {bulkTier ? `${bulkTier.label} deal` : stockLabel}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
