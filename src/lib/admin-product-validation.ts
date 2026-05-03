export type ProductTierInput = {
  minQty: number;
  maxQty: number | null;
  unitPrice: number;
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
  stockStatus: string;
  leadTime: string | null;
  imageUrl: string | null;
  description: string | null;
  active: boolean;
  supplierNotes: string | null;
  internalCostNotes: string | null;
  adminNotes: string | null;
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
  const slug = clean(raw.slug);
  const categoryId = clean(raw.categoryId);
  const stockStatus = clean(raw.stockStatus) || "for_order";
  const moq = toNumber(raw.moq);
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

  if (!sku) {
    return { error: "SKU is required." };
  }

  if (!name) {
    return { error: "Product Name is required." };
  }

  if (!slug) {
    return { error: "Slug is required." };
  }

  if (!categoryId) {
    return { error: "Category is required." };
  }

  if (!Number.isInteger(moq) || moq <= 0) {
    return { error: "MOQ must be greater than 0." };
  }

  if (!stockStatuses.has(stockStatus)) {
    return { error: "Invalid stock status." };
  }

  const active = Boolean(raw.active);

  if (active && !tiers.length) {
    return { error: "At least one price tier is required for active products." };
  }

  const tierError = validateTierRules(tiers);

  if (tierError) {
    return { error: tierError };
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
      stockStatus,
      leadTime: nullableText(raw.leadTime),
      imageUrl: nullableText(raw.imageUrl),
      description: nullableText(raw.description),
      active,
      supplierNotes: nullableText(raw.supplierNotes),
      internalCostNotes: nullableText(raw.internalCostNotes),
      adminNotes: nullableText(raw.adminNotes),
      tiers,
    },
  };
}
