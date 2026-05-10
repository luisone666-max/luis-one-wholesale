import { formatMoney, getPriceRange, type Category, type Product } from "@/lib/mock-data";
import { businessInfo } from "@/lib/business-info";

export const productionSiteUrl = "https://luisonesupplyhub.com";
export const siteName = "Luis One Supply Hub";
export const siteDescription =
  "Motorcycle helmets, accessories, parts, and wholesale supplies for resellers and shops in the Philippines with public tier pricing and manual order confirmation.";

function isConfiguredSiteUrl(value: string | undefined) {
  if (!value) return false;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      !host.endsWith("supabase.co") &&
      !host.endsWith(".vercel.app") &&
      host !== "localhost" &&
      host !== "127.0.0.1"
    );
  } catch {
    return false;
  }
}

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

  const siteUrl = isConfiguredSiteUrl(configuredUrl)
    ? configuredUrl!
    : process.env.NODE_ENV === "production"
      ? productionSiteUrl
      : vercelUrl
        ? `https://${vercelUrl}`
        : productionSiteUrl;

  return siteUrl.replace(/\/$/, "");
}

export function absoluteUrl(pathOrUrl: string | undefined) {
  const fallback = "/brand/luis-one-logo.jpg";
  const value = pathOrUrl || fallback;

  if (value.toLowerCase().endsWith(".svg")) {
    return `${getSiteUrl()}${fallback}`;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${getSiteUrl()}${value.startsWith("/") ? value : `/${value}`}`;
}

export function stripText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function getProductPriceBounds(product: Product) {
  const prices = [
    product.retailPrice ?? 0,
    ...product.tiers.map((tier) => tier.price),
    ...(product.variants ?? []).flatMap((variant) => variant.tiers.map((tier) => tier.price)),
  ].filter((price) => Number.isFinite(price) && price > 0);

  if (!prices.length) {
    return { lowPrice: 0, highPrice: 0 };
  }

  return {
    lowPrice: Math.min(...prices),
    highPrice: Math.max(...prices),
  };
}

function stockAvailability(product: Product) {
  if (product.stockStatus === "In stock") {
    return "https://schema.org/InStock";
  }

  if (product.stockStatus === "Low stock") {
    return "https://schema.org/LimitedAvailability";
  }

  if (product.stockStatus === "Unavailable") {
    return "https://schema.org/OutOfStock";
  }

  return "https://schema.org/PreOrder";
}

export function productJsonLd(product: Product) {
  const url = `${getSiteUrl()}/product/${product.slug}`;
  const { lowPrice, highPrice } = getProductPriceBounds(product);
  const images = Array.from(new Set([product.image, ...(product.gallery ?? [])].map(absoluteUrl)));

  const structuredProduct: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    image: images,
    description: stripText(product.description),
    category: product.category,
    brand: {
      "@type": "Brand",
      name: siteName,
    },
  };

  if (lowPrice > 0 && highPrice > 0) {
    structuredProduct.offers = {
      "@type": "AggregateOffer",
      url,
      priceCurrency: "PHP",
      lowPrice,
      highPrice,
      availability: stockAvailability(product),
      offerCount: product.tiers.length + (product.variants?.length ?? 0),
    };
  }

  return structuredProduct;
}

export function productSeoDescription(product: Product) {
  const priceRange = getPriceRange(product);
  const priceText = priceRange === "Contact for quotation"
    ? product.retailPrice
      ? `Retail price: ${formatMoney(product.retailPrice)}`
      : "Price available on request"
    : `Price range: ${priceRange}`;
  const stockText = product.stockStatus === "Unavailable" ? "Messenger inquiry only" : product.stockStatus;

  return stripText(
    `${product.category} wholesale item for resellers and shops in the Philippines. ${priceText}. MOQ ${product.moq} pc. Stock: ${stockText}. Orders are manually confirmed for pickup, courier, or Lalamove arrangement.`,
  );
}

export function productPageTitle(product: Product) {
  return `${product.name} | ${siteName}`;
}

export function productShareTitle(product: Product) {
  const priceRange = getPriceRange(product);

  if (priceRange === "Contact for quotation") {
    if (product.retailPrice) {
      return `${product.name} | ${formatMoney(product.retailPrice)}`;
    }

    return `${product.name} | Ask price on Messenger`;
  }

  return `${product.name} | ${priceRange}`;
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteName,
    url: getSiteUrl(),
    logo: absoluteUrl("/brand/luis-one-logo.jpg"),
    image: absoluteUrl("/brand/luis-one-logo.jpg"),
    description: businessInfo.description,
    telephone: businessInfo.phoneTel,
    address: {
      "@type": "PostalAddress",
      streetAddress: "1373 Narra St",
      addressLocality: "Tondo, Manila",
      addressCountry: "PH",
    },
    openingHours: "Mo-Su 08:00-18:00",
    sameAs: [businessInfo.facebookUrl],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: getSiteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${getSiteUrl()}/category/all?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function categoryDescription(category: Category | null) {
  if (!category) {
    return "Browse public wholesale prices, MOQ, stock status, and tier pricing for resellers and shops in the Philippines.";
  }

  return stripText(
    `${category.description} Browse ${category.name} wholesale products with public prices, MOQ, and manual order confirmation.`,
  );
}
