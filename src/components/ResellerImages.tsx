import { ProductImage } from "@/components/CustomerUi";
import type { Product } from "@/lib/mock-data";

const placeholderImages = new Set(["/products/phone-accessories.svg"]);

function uniqueProductImages(product: Product) {
  const images = [
    product.image,
    ...product.gallery,
    ...(product.variants ?? []).map((variant) => variant.image),
  ].filter((image): image is string => typeof image === "string" && !placeholderImages.has(image));

  return Array.from(new Set(images));
}

function downloadHref(image: string, product: Product, index: number) {
  const params = new URLSearchParams({
    url: image,
    name: `${product.slug}-${index + 1}`,
  });

  return `/api/product-images/download?${params.toString()}`;
}

export function ResellerImages({ product }: { product: Product }) {
  const images = uniqueProductImages(product);

  if (!images.length) {
    return null;
  }

  return (
    <section className="mt-6 rounded-sm border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Reseller Images</p>
          <h2 className="mt-1 text-xl font-black text-zinc-950">Reseller Images</h2>
        </div>
        <p className="text-xs font-bold text-zinc-500 sm:text-right">Download original product images for reseller posting.</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <article key={image} className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
            <div className="aspect-square bg-gradient-to-br from-orange-50 via-white to-zinc-50 p-2">
              <ProductImage src={image} alt={`${product.name} reseller image ${index + 1}`} />
            </div>
            <div className="border-t border-zinc-100 p-2 sm:p-3">
              <a
                href={downloadHref(image, product, index)}
                className="grid h-10 place-items-center rounded-sm bg-[#f65f18] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#df4f0d] sm:text-sm"
              >
                Download Image
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
