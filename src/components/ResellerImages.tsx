import { ProductImage } from "@/components/CustomerUi";
import type { Product } from "@/lib/mock-data";

const placeholderImages = new Set(["/products/phone-accessories.svg"]);

type ResellerImageItem = {
  url: string;
  label: string;
};

function isDownloadableImage(image: string | undefined): image is string {
  if (!image || placeholderImages.has(image)) {
    return false;
  }

  return !(image.startsWith("/products/") && image.toLowerCase().endsWith(".svg"));
}

function uniqueProductImages(product: Product) {
  const images: ResellerImageItem[] = [];
  const seen = new Set<string>();

  const addImage = (url: string | undefined, label: string) => {
    if (!isDownloadableImage(url) || seen.has(url)) {
      return;
    }

    seen.add(url);
    images.push({ url, label });
  };

  addImage(product.image, `${product.name} - Main image`);

  product.gallery.forEach((image, index) => {
    addImage(image, `${product.name} - Gallery image ${index + 1}`);
  });

  for (const variant of product.variants ?? []) {
    if (!variant.active) {
      continue;
    }

    const variantLabel = [variant.name, variant.sku].filter(Boolean).join(" - ");
    addImage(variant.image, `Variant image - ${variantLabel}`);
  }

  return images;
}

function safeFileSlug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "image"
  );
}

function downloadHref(image: ResellerImageItem, product: Product, index: number) {
  const params = new URLSearchParams({
    url: image.url,
    name: `${product.slug}-${String(index + 1).padStart(2, "0")}-${safeFileSlug(image.label)}`,
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
          <article key={image.url} className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
            <div className="aspect-square bg-gradient-to-br from-orange-50 via-white to-zinc-50 p-2">
              <ProductImage src={image.url} alt={`${product.name} ${image.label}`} />
            </div>
            <div className="space-y-2 border-t border-zinc-100 p-2 sm:p-3">
              <p className="line-clamp-2 min-h-8 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-500">{image.label}</p>
              <a
                href={downloadHref(image, product, index)}
                className="grid h-10 place-items-center rounded-sm bg-[#f65f18] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#df4f0d] sm:text-sm"
              >
                Download Image
              </a>
              <a
                href={image.url}
                target="_blank"
                rel="noreferrer"
                className="block truncate rounded-sm bg-zinc-50 px-2 py-1.5 text-[11px] font-bold text-zinc-500 hover:text-orange-700"
                title={image.url}
              >
                Open original image
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
