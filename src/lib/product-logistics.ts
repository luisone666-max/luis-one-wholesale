export const shippingCategoryValues = ["standard", "oversized", "fragile", "restricted"] as const;

export type ShippingCategory = (typeof shippingCategoryValues)[number];

export type ProductLogistics = {
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  codEnabled: boolean;
  fragile: boolean;
  containsBattery: boolean;
  containsLiquid: boolean;
  shippingCategory: ShippingCategory;
  shippingNotes: string;
};

export const defaultProductLogistics: ProductLogistics = {
  weightGrams: null,
  lengthCm: null,
  widthCm: null,
  heightCm: null,
  codEnabled: true,
  fragile: false,
  containsBattery: false,
  containsLiquid: false,
  shippingCategory: "standard",
  shippingNotes: "",
};

export function isShippingCategory(value: string): value is ShippingCategory {
  return (shippingCategoryValues as readonly string[]).includes(value);
}

export function getVolumetricWeightGrams(lengthCm: number | null, widthCm: number | null, heightCm: number | null, divisor = 3500) {
  if (!lengthCm || !widthCm || !heightCm || divisor <= 0) {
    return null;
  }

  return Math.ceil((lengthCm * widthCm * heightCm * 1000) / divisor);
}

export function getBillableWeightGrams(logistics: Pick<ProductLogistics, "weightGrams" | "lengthCm" | "widthCm" | "heightCm">) {
  const volumetricWeight = getVolumetricWeightGrams(logistics.lengthCm, logistics.widthCm, logistics.heightCm);

  if (!logistics.weightGrams && !volumetricWeight) {
    return null;
  }

  return Math.max(logistics.weightGrams ?? 0, volumetricWeight ?? 0);
}
