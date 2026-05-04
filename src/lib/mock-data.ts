export type PriceTier = {
  label: string;
  min: number;
  max: number | null;
  price: number;
};

export type Product = {
  id?: string;
  sku?: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  categoryPathSlugs?: string[];
  image: string;
  gallery: string[];
  moq: number;
  retailPrice?: number | null;
  stockStatus: "In stock" | "Low stock" | "Preorder";
  stockCount: number;
  sold: number;
  rating: number;
  description: string;
  details: string[];
  tiers: PriceTier[];
  searchText?: string;
  variants?: ProductVariant[];
};

export type ProductVariant = {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  model?: string;
  fits?: string;
  image?: string;
  moq: number;
  stockStatus: Product["stockStatus"];
  leadTime?: string;
  active: boolean;
  sortOrder: number;
  tiers: PriceTier[];
};

export type Category = {
  slug: string;
  name: string;
  description: string;
  itemCount: number;
  active: boolean;
  image?: string;
  level?: number;
};

const standardTiers = (base: number): PriceTier[] => [
  { label: "1-5 pcs", min: 1, max: 5, price: base },
  { label: "6-11 pcs", min: 6, max: 11, price: +(base * 0.94).toFixed(2) },
  { label: "12-49 pcs", min: 12, max: 49, price: +(base * 0.88).toFixed(2) },
  { label: "50+ pcs", min: 50, max: null, price: +(base * 0.79).toFixed(2) },
];

export const categories: Category[] = [
  {
    slug: "motorcycle-parts",
    name: "Motorcycle Parts",
    description: "Fast-moving replacement parts for scooters and commuter bikes.",
    itemCount: 3,
    active: true,
    image: "/products/topbox-bracket.svg",
  },
  {
    slug: "automotive-care",
    name: "Automotive Care",
    description: "Cleaning, maintenance, and workshop supply products.",
    itemCount: 1,
    active: true,
    image: "/products/contact-cleaner.svg",
  },
  {
    slug: "grocery",
    name: "Grocery Wholesale",
    description: "Shelf-ready food items for retail and food service buyers.",
    itemCount: 1,
    active: true,
    image: "/products/chili-powder.svg",
  },
  {
    slug: "electronics",
    name: "Phone Accessories",
    description: "Daily demand mobile accessories for counters and kiosks.",
    itemCount: 1,
    active: true,
    image: "/products/phone-accessories.svg",
  },
];

export const products: Product[] = [
  {
    slug: "flat-seat-click-125-150-160",
    name: "Flat Seat Click 125 / 150 / 160",
    category: "Motorcycle Parts",
    categorySlug: "motorcycle-parts",
    image: "/products/flat-seat-click.svg",
    gallery: ["/products/flat-seat-click.svg", "/products/flat-seat-click-alt.svg"],
    moq: 1,
    stockStatus: "In stock",
    stockCount: 320,
    sold: 1840,
    rating: 4.8,
    description:
      "Replacement flat scooter seat with reinforced base, synthetic leather cover, and fitment for Click 125, 150, and 160 variants.",
    details: ["Water-resistant seat cover", "Packed individually", "Common wholesale item for repair shops"],
    tiers: standardTiers(22.5),
  },
  {
    slug: "ignition-keyset-mio-click",
    name: "Ignition Keyset Mio / Click",
    category: "Motorcycle Parts",
    categorySlug: "motorcycle-parts",
    image: "/products/ignition-keyset.svg",
    gallery: ["/products/ignition-keyset.svg", "/products/ignition-keyset-alt.svg"],
    moq: 1,
    stockStatus: "In stock",
    stockCount: 540,
    sold: 2230,
    rating: 4.7,
    description:
      "Universal-style ignition keyset for Mio and Click service replacement demand, supplied with keys and compact retail packaging.",
    details: ["Includes two keys", "Workshop-friendly bulk cartons", "Suitable for reseller display shelves"],
    tiers: standardTiers(8.2),
  },
  {
    slug: "topbox-bracket-nmax-aerox",
    name: "Topbox Bracket NMAX / Aerox",
    category: "Motorcycle Parts",
    categorySlug: "motorcycle-parts",
    image: "/products/topbox-bracket.svg",
    gallery: ["/products/topbox-bracket.svg", "/products/topbox-bracket-alt.svg"],
    moq: 1,
    stockStatus: "Low stock",
    stockCount: 74,
    sold: 980,
    rating: 4.6,
    description:
      "Powder-coated rear topbox bracket for NMAX and Aerox models, made for shops selling touring and delivery-bike accessories.",
    details: ["Heavy-duty mounting points", "Matte black finish", "Carton packing for wholesale handling"],
    tiers: standardTiers(14.9),
  },
  {
    slug: "contact-cleaner-spray-450ml",
    name: "Contact Cleaner Spray 450ml",
    category: "Automotive Care",
    categorySlug: "automotive-care",
    image: "/products/contact-cleaner.svg",
    gallery: ["/products/contact-cleaner.svg", "/products/contact-cleaner-alt.svg"],
    moq: 1,
    stockStatus: "In stock",
    stockCount: 860,
    sold: 4120,
    rating: 4.9,
    description:
      "Fast-drying 450ml contact cleaner spray for electrical contacts, switches, workshop maintenance, and counter sales.",
    details: ["450ml aerosol can", "Fast-moving workshop consumable", "Case-ready wholesale packing"],
    tiers: standardTiers(3.8),
  },
  {
    slug: "chili-powder",
    name: "Chili Powder",
    category: "Grocery Wholesale",
    categorySlug: "grocery",
    image: "/products/chili-powder.svg",
    gallery: ["/products/chili-powder.svg", "/products/chili-powder-alt.svg"],
    moq: 1,
    stockStatus: "In stock",
    stockCount: 1200,
    sold: 5360,
    rating: 4.8,
    description:
      "Retail-ready chili powder packs for grocery stores, canteens, and food service buyers needing repeat wholesale supply.",
    details: ["Shelf-ready pouch packing", "Stable bulk inventory", "Suitable for mixed carton orders"],
    tiers: standardTiers(1.6),
  },
  {
    slug: "phone-accessories",
    name: "Phone Accessories",
    category: "Phone Accessories",
    categorySlug: "electronics",
    image: "/products/phone-accessories.svg",
    gallery: ["/products/phone-accessories.svg", "/products/phone-accessories-alt.svg"],
    moq: 1,
    stockStatus: "Preorder",
    stockCount: 260,
    sold: 3180,
    rating: 4.5,
    description:
      "Assorted phone accessory wholesale bundle with charging cables, adapters, screen protectors, and daily counter items.",
    details: ["Assorted fast-moving SKUs", "Good for kiosk and counter resale", "Preorder mix can be adjusted later"],
    tiers: standardTiers(2.4),
  },
];

export function formatMoney(value: number) {
  return `PHP ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getProductsByCategory(slug: string) {
  return products.filter((product) => product.categorySlug === slug);
}

export function getActiveCategories() {
  return categories.filter((category) => category.active);
}

export function getActiveProducts() {
  const activeSlugs = new Set(getActiveCategories().map((category) => category.slug));
  return products.filter((product) => activeSlugs.has(product.categorySlug));
}

export function getActiveCategoryBySlug(slug: string) {
  return getActiveCategories().find((category) => category.slug === slug);
}

export function getActiveProductBySlug(slug: string) {
  const activeSlugs = new Set(getActiveCategories().map((category) => category.slug));
  return products.find((product) => product.slug === slug && activeSlugs.has(product.categorySlug));
}

export function getActiveProductsByCategory(slug: string) {
  return getActiveProducts().filter((product) => product.categorySlug === slug);
}

export function getPriceRange(product: Product) {
  const prices = product.tiers.map((tier) => tier.price);
  return `${formatMoney(Math.min(...prices))} - ${formatMoney(Math.max(...prices))}`;
}

export function getVariantPriceRange(variant: ProductVariant) {
  const prices = variant.tiers.map((tier) => tier.price);
  return `${formatMoney(Math.min(...prices))} - ${formatMoney(Math.max(...prices))}`;
}

export function getTierForQuantity(product: Product, quantity: number) {
  return (
    product.tiers.find((tier) => quantity >= tier.min && (tier.max === null || quantity <= tier.max)) ??
    product.tiers[0]
  );
}

