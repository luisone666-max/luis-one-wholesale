import { isShippingCategory, type ShippingCategory } from "@/lib/product-logistics";

export type ProductTierInput = {
  minQty: number;
  maxQty: number | null;
  unitPrice: number;
};

export type ProductLogisticsInput = {
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  codEnabled: boolean;
  fragile: boolean;
  containsBattery: boolean;
  containsLiquid: boolean;
  shippingCategory: ShippingCategory;
  shippingNotes: string | null;
};

export type ProductPayload = {
  sku: string;
  name: string;
  slug: string;
  categoryId: string;
  subcategoryId: string | null;
  childCategoryId: string | null;
  brand: string | null;
  model: string | null;
  moq: number;
  retailPrice: number | null;
  stockStatus: string;
  leadTime: string | null;
  imageUrl: string | null;
  description: string | null;
  active: boolean;
  supplierNotes: string | null;
  internalCostNotes: string | null;
  adminNotes: string | null;
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  codEnabled: boolean;
  fragile: boolean;
  containsBattery: boolean;
  containsLiquid: boolean;
  shippingCategory: ShippingCategory;
  shippingNotes: string | null;
  tiers: ProductTierInput[];
  variants: ProductVariantInput[];
};

export type ProductVariantInput = {
  id?: string;
  name: string;
  sku: string | null;
  model: string | null;
  fits: string | null;
  imageUrl: string | null;
  moq: number;
  stockStatus: string;
  leadTime: string | null;
  active: boolean;
  sortOrder: number;
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  codEnabled: boolean;
  fragile: boolean;
  containsBattery: boolean;
  containsLiquid: boolean;
  shippingCategory: ShippingCategory;
  shippingNotes: string | null;
  tiers: ProductTierInput[];
};

const stockStatuses = new Set(["ready_stock", "for_order", "low_stock", "unavailable"]);

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown) {
  const text = clean(value);
  return text || null;
}

function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function optionalPositiveNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : NaN;
}

function slugifyProduct(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

function parseLogisticsInput(raw: Record<string, unknown>): ProductLogisticsInput {
  const shippingCategory = clean(raw.shippingCategory) || "standard";

  return {
    weightGrams: optionalPositiveNumber(raw.weightGrams),
    lengthCm: optionalPositiveNumber(raw.lengthCm),
    widthCm: optionalPositiveNumber(raw.widthCm),
    heightCm: optionalPositiveNumber(raw.heightCm),
    codEnabled: raw.codEnabled === undefined ? true : Boolean(raw.codEnabled),
    fragile: Boolean(raw.fragile),
    containsBattery: Boolean(raw.containsBattery),
    containsLiquid: Boolean(raw.containsLiquid),
    shippingCategory: isShippingCategory(shippingCategory) ? shippingCategory : "standard",
    shippingNotes: nullableText(raw.shippingNotes),
  };
}

function validateLogisticsInput(logistics: ProductLogisticsInput, label: string) {
  if (Number.isNaN(logistics.weightGrams)) {
    return `${label} weight must be greater than 0.`;
  }

  if (Number.isNaN(logistics.lengthCm) || Number.isNaN(logistics.widthCm) || Number.isNaN(logistics.heightCm)) {
    return `${label} package dimensions must be greater than 0.`;
  }

  if (!isShippingCategory(logistics.shippingCategory)) {
    return `${label} shipping category is invalid.`;
  }

  return "";
}

export function validateTierRules(tiers: ProductTierInput[]) {
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);

  for (const tier of sorted) {
    if (!Number.isInteger(tier.minQty) || tier.minQty <= 0) {
      return "Tier minimum quantity must be greater than 0.";
    }

    if (tier.maxQty !== null && (!Number.isInteger(tier.maxQty) || tier.minQty >= tier.maxQty)) {
      return "Tier min_qty must be less than max_qty if max_qty exists.";
    }

    if (!Number.isFinite(tier.unitPrice) || tier.unitPrice <= 0) {
      return "Tier unit price must be greater than 0.";
    }
  }

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];

    if (previous.maxQty === null || current.minQty <= previous.maxQty) {
      return "Price tiers cannot overlap.";
    }

    if (current.unitPrice > previous.unitPrice) {
      return "Higher quantity price should not be higher than lower quantity price.";
    }
  }

  return "";
}

export function parseProductPayload(raw: Record<string, unknown>): { value: ProductPayload } | { error: string } {
  const sku = clean(raw.sku);
  const name = clean(raw.name);
  const rawSlug = clean(raw.slug);
  const categoryId = clean(raw.categoryId);
  const stockStatus = clean(raw.stockStatus) || "for_order";
  const moq = toNumber(raw.moq);
  const retailPrice = optionalPositiveNumber(raw.retailPrice);
  const productLogistics = parseLogisticsInput(raw);
  const tiers = Array.isArray(raw.tiers)
    ? raw.tiers.map((tier) => {
        const item = tier as Record<string, unknown>;
        const maxQtyValue = item.maxQty === null || item.maxQty === "" || item.maxQty === undefined ? null : Number(item.maxQty);

        return {
          minQty: Number(item.minQty),
          maxQty: maxQtyValue,
          unitPrice: Number(item.unitPrice),
        };
      })
    : [];
  const variants = Array.isArray(raw.variants)
    ? raw.variants.map((variant, index) => {
        const item = variant as Record<string, unknown>;
        const variantTiers = Array.isArray(item.tiers)
          ? item.tiers.map((tier) => {
              const tierItem = tier as Record<string, unknown>;
              const maxQtyValue =
                tierItem.maxQty === null || tierItem.maxQty === "" || tierItem.maxQty === undefined ? null : Number(tierItem.maxQty);

              return {
                minQty: Number(tierItem.minQty),
                maxQty: maxQtyValue,
                unitPrice: Number(tierItem.unitPrice),
              };
            })
          : [];

        return {
          id: nullableText(item.id) ?? undefined,
          name: clean(item.name),
          sku: nullableText(item.sku),
          model: nullableText(item.model),
          fits: nullableText(item.fits),
          imageUrl: nullableText(item.imageUrl),
          moq: toNumber(item.moq),
          stockStatus: clean(item.stockStatus) || "for_order",
          leadTime: nullableText(item.leadTime),
          active: Boolean(item.active),
          sortOrder: Number.isInteger(Number(item.sortOrder)) ? Number(item.sortOrder) : index,
          ...parseLogisticsInput(item),
          tiers: variantTiers,
        };
      })
    : [];

  if (!sku) {
    return { error: "SKU is required." };
  }

  if (!name) {
    return { error: "Product Name is required." };
  }

  const slug = slugifyProduct(rawSlug || name || sku);

  if (!categoryId) {
    return { error: "Category is required." };
  }

  if (!Number.isInteger(moq) || moq <= 0) {
    return { error: "MOQ must be greater than 0." };
  }

  if (Number.isNaN(retailPrice)) {
    return { error: "Retail Price must be greater than 0." };
  }

  if (!stockStatuses.has(stockStatus)) {
    return { error: "Invalid stock status." };
  }

  const logisticsError = validateLogisticsInput(productLogistics, "Product");

  if (logisticsError) {
    return { error: logisticsError };
  }

  const active = Boolean(raw.active);

  if (active && !tiers.length) {
    return { error: "At least one price tier is required for active products." };
  }

  const tierError = validateTierRules(tiers);

  if (tierError) {
    return { error: tierError };
  }

  for (const variant of variants) {
    if (!variant.name) {
      return { error: "Variant name is required." };
    }

    if (!Number.isInteger(variant.moq) || variant.moq <= 0) {
      return { error: "Variant MOQ must be greater than 0." };
    }

    if (!stockStatuses.has(variant.stockStatus)) {
      return { error: "Invalid variant stock status." };
    }

    const variantLogisticsError = validateLogisticsInput(variant, `Variant ${variant.name}`);

    if (variantLogisticsError) {
      return { error: variantLogisticsError };
    }

    if (variant.active && !variant.tiers.length) {
      return { error: "At least one price tier is required for active variants." };
    }

    const variantTierError = validateTierRules(variant.tiers);

    if (variantTierError) {
      return { error: `Variant ${variant.name}: ${variantTierError}` };
    }
  }

  return {
    value: {
      sku,
      name,
      slug,
      categoryId,
      subcategoryId: nullableText(raw.subcategoryId),
      childCategoryId: nullableText(raw.childCategoryId),
      brand: nullableText(raw.brand),
      model: nullableText(raw.model),
      moq,
      retailPrice,
      stockStatus,
      leadTime: nullableText(raw.leadTime),
      imageUrl: nullableText(raw.imageUrl),
      description: nullableText(raw.description),
      active,
      supplierNotes: nullableText(raw.supplierNotes),
      internalCostNotes: nullableText(raw.internalCostNotes),
      adminNotes: nullableText(raw.adminNotes),
      ...productLogistics,
      tiers,
      variants,
    },
  };
}
