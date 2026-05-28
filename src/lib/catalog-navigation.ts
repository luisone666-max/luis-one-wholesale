export const customerNavigationCategorySlugs = [
  "helmets",
  "motorcycle-storage",
  "engine-parts",
  "brake-system",
  "drive-train",
  "lights-electrical",
  "wheels-tires",
  "controls-cables",
  "controls-footrests",
  "body-parts",
  "exhaust",
  "motorcycle-accessories",
  "care-maintenance",
  "suspension",
] as const;

export const customerNavigationCategorySlugSet = new Set<string>(customerNavigationCategorySlugs);

export function customerNavigationSortIndex(slug: string) {
  const index = customerNavigationCategorySlugs.indexOf(slug as (typeof customerNavigationCategorySlugs)[number]);
  return index === -1 ? customerNavigationCategorySlugs.length : index;
}
