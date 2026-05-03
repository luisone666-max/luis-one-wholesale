export type CategoryPayload = {
  nameEn: string;
  nameZh: string | null;
  slug: string;
  parentId: string | null;
  iconUrl: string | null;
  imageUrl: string | null;
  active: boolean;
  showOnHomepage: boolean;
  showInNavigation: boolean;
  sortOrder: number;
  templateType: string | null;
  description: string | null;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown) {
  const text = clean(value);
  return text || null;
}

export function parseCategoryPayload(raw: Record<string, unknown>): { value: CategoryPayload } | { error: string } {
  const nameEn = clean(raw.nameEn);
  const slug = clean(raw.slug);
  const sortOrder = Number(raw.sortOrder);

  if (!nameEn) {
    return { error: "Category Name English is required." };
  }

  if (!slug) {
    return { error: "Slug is required." };
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return { error: "Sort Order must be 0 or higher." };
  }

  return {
    value: {
      nameEn,
      nameZh: nullableText(raw.nameZh),
      slug,
      parentId: nullableText(raw.parentId),
      iconUrl: nullableText(raw.iconUrl),
      imageUrl: nullableText(raw.imageUrl),
      active: Boolean(raw.active),
      showOnHomepage: Boolean(raw.showOnHomepage),
      showInNavigation: Boolean(raw.showInNavigation),
      sortOrder,
      templateType: nullableText(raw.templateType),
      description: nullableText(raw.description),
    },
  };
}
