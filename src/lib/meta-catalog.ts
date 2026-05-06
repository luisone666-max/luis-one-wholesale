import { absoluteUrl, getProductPriceBounds, getSiteUrl, stripText } from "@/lib/seo";
import type { Product, ProductVariant } from "@/lib/mock-data";

export type MetaCatalogRow = {
  id: string;
  title: string;
  description: string;
  availability: string;
  condition: string;
  price: string;
  link: string;
  image_link: string;
  brand: string;
  mpn: string;
  item_group_id: string;
};

const catalogHeaders: (keyof MetaCatalogRow)[] = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "brand",
  "mpn",
  "item_group_id",
];

export function metaCatalogItemId(product: Product, variant?: ProductVariant | null) {
  if (variant) {
    return variant.sku || variant.id;
  }

  return product.sku || product.id || product.slug;
}

function metaAvailability(status: Product["stockStatus"]) {
  if (status === "In stock" || status === "Low stock") {
    return "in stock";
  }

  if (status === "Unavailable") {
    return "out of stock";
  }

  return "available for order";
}

function metaPrice(value: number) {
  return `${Math.max(0, value).toFixed(2)} PHP`;
}

function catalogDescription(product: Product, variant?: ProductVariant | null) {
  const parts = [
    product.description,
    variant?.name ? `Variant: ${variant.name}.` : "",
    variant?.model ? `Model: ${variant.model}.` : "",
    variant?.fits ? `Fits: ${variant.fits}.` : "",
    `MOQ ${variant?.moq ?? product.moq} pc.`,
    "Wholesale order is manually confirmed by Luis One Supply Hub.",
  ];

  return stripText(parts.filter(Boolean).join(" ")).slice(0, 5000);
}

function csvCell(value: string | number) {
  const text = String(value).replace(/\r?\n/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function productPrice(product: Product, variant?: ProductVariant | null) {
  const prices = variant?.tiers.length ? variant.tiers.map((tier) => tier.price) : product.tiers.map((tier) => tier.price);
  const usablePrices = prices.filter((price) => Number.isFinite(price) && price > 0);

  if (product.retailPrice && product.retailPrice > 0) {
    return product.retailPrice;
  }

  if (usablePrices.length) {
    return Math.min(...usablePrices);
  }

  return getProductPriceBounds(product).lowPrice;
}

export function productToMetaCatalogRows(product: Product): MetaCatalogRow[] {
  const productUrl = `${getSiteUrl()}/product/${product.slug}`;
  const groupId = product.sku || product.id || product.slug;
  const activeVariants = product.variants?.filter((variant) => variant.active) ?? [];

  if (activeVariants.length) {
    return activeVariants.map((variant) => ({
      id: metaCatalogItemId(product, variant),
      title: `${product.name} - ${variant.name}`.slice(0, 150),
      description: catalogDescription(product, variant),
      availability: metaAvailability(variant.stockStatus),
      condition: "new",
      price: metaPrice(productPrice(product, variant)),
      link: productUrl,
      image_link: absoluteUrl(variant.image || product.image),
      brand: "Luis One Supply Hub",
      mpn: variant.sku || product.sku || variant.id,
      item_group_id: groupId,
    }));
  }

  return [
    {
      id: metaCatalogItemId(product),
      title: product.name.slice(0, 150),
      description: catalogDescription(product),
      availability: metaAvailability(product.stockStatus),
      condition: "new",
      price: metaPrice(productPrice(product)),
      link: productUrl,
      image_link: absoluteUrl(product.image),
      brand: "Luis One Supply Hub",
      mpn: product.sku || product.id || product.slug,
      item_group_id: groupId,
    },
  ];
}

export function buildMetaCatalogCsv(products: Product[]) {
  const rows = products.flatMap(productToMetaCatalogRows);
  const csvRows = [
    catalogHeaders.join(","),
    ...rows.map((row) => catalogHeaders.map((header) => csvCell(row[header])).join(",")),
  ];

  return `${csvRows.join("\r\n")}\r\n`;
}
