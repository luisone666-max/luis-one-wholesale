import { getProductPriceTiers, type Product } from "@/lib/mock-data";

export function getProductCreatedTime(product: { createdAt?: string | null; slug: string }) {
  if (!product.createdAt) {
    return 0;
  }

  const time = Date.parse(product.createdAt);
  return Number.isFinite(time) ? time : 0;
}

function stockRank(product: Product) {
  if (product.stockStatus === "In stock") {
    return 0;
  }

  if (product.stockStatus === "Low stock") {
    return 1;
  }

  if (product.stockStatus === "Preorder") {
    return 2;
  }

  return 3;
}

function hasRealImage(product: Product) {
  return Boolean(product.image && !product.image.includes("/products/phone-accessories.svg") && !product.image.includes("/brand/luis-one-logo.jpg"));
}

function hasWholesalePrice(product: Product) {
  return getProductPriceTiers(product).length > 0;
}

export function compareRecommendedProducts(a: Product, b: Product) {
  return (
    stockRank(a) - stockRank(b) ||
    Number(hasRealImage(b)) - Number(hasRealImage(a)) ||
    Number(hasWholesalePrice(b)) - Number(hasWholesalePrice(a)) ||
    getProductCreatedTime(b) - getProductCreatedTime(a) ||
    a.name.localeCompare(b.name)
  );
}
