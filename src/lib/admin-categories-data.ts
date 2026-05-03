import { createSupabaseAdminClient } from "@/lib/supabase/server";

type CategoryRow = {
  id: string;
  name_en: string;
  name_zh: string | null;
  slug: string;
  parent_id: string | null;
  level: number;
  icon_url: string | null;
  image_url: string | null;
  active: boolean | null;
  show_on_homepage: boolean | null;
  show_in_navigation: boolean | null;
  sort_order: number | null;
  template_type: string | null;
  description: string | null;
};

type ProductCategoryRow = {
  category_id: string | null;
  subcategory_id: string | null;
  child_category_id: string | null;
};

export type AdminCategoryRecord = {
  id: string;
  nameEn: string;
  nameZh: string;
  slug: string;
  parentId: string | null;
  level: number;
  iconUrl: string;
  imageUrl: string;
  active: boolean;
  showOnHomepage: boolean;
  showInNavigation: boolean;
  sortOrder: number;
  templateType: string;
  description: string;
  directProductCount: number;
  totalProductCount: number;
};

export type AdminCategoriesResult = {
  categories: AdminCategoryRecord[];
  error?: string;
};

function descendantIds(categoryId: string, childrenByParentId: Map<string, AdminCategoryRecord[]>): string[] {
  const children = childrenByParentId.get(categoryId) ?? [];

  return children.flatMap((child) => [child.id, ...descendantIds(child.id, childrenByParentId)]);
}

export async function getAdminCategories(): Promise<AdminCategoriesResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { categories: [], error: "Supabase admin client is not configured." };
  }

  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from("categories")
      .select(
        "id,name_en,name_zh,slug,parent_id,level,icon_url,image_url,active,show_on_homepage,show_in_navigation,sort_order,template_type,description",
      )
      .order("level", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase.from("products").select("category_id,subcategory_id,child_category_id"),
  ]);

  if (categoriesResult.error) {
    return { categories: [], error: categoriesResult.error.message };
  }

  if (productsResult.error) {
    return { categories: [], error: productsResult.error.message };
  }

  const directCounts = new Map<string, number>();

  for (const product of (productsResult.data ?? []) as ProductCategoryRow[]) {
    for (const categoryId of [product.category_id, product.subcategory_id, product.child_category_id]) {
      if (categoryId) {
        directCounts.set(categoryId, (directCounts.get(categoryId) ?? 0) + 1);
      }
    }
  }

  const categories = ((categoriesResult.data ?? []) as CategoryRow[]).map((category) => ({
    id: category.id,
    nameEn: category.name_en,
    nameZh: category.name_zh ?? "",
    slug: category.slug,
    parentId: category.parent_id,
    level: category.level,
    iconUrl: category.icon_url ?? "",
    imageUrl: category.image_url ?? "",
    active: Boolean(category.active),
    showOnHomepage: Boolean(category.show_on_homepage),
    showInNavigation: Boolean(category.show_in_navigation),
    sortOrder: category.sort_order ?? 0,
    templateType: category.template_type ?? "",
    description: category.description ?? "",
    directProductCount: directCounts.get(category.id) ?? 0,
    totalProductCount: 0,
  }));

  const childrenByParentId = new Map<string, AdminCategoryRecord[]>();

  for (const category of categories) {
    if (!category.parentId) {
      continue;
    }

    childrenByParentId.set(category.parentId, [...(childrenByParentId.get(category.parentId) ?? []), category]);
  }

  return {
    categories: categories.map((category) => {
      const totalProductCount = [category.id, ...descendantIds(category.id, childrenByParentId)].reduce(
        (sum, id) => sum + (directCounts.get(id) ?? 0),
        0,
      );

      return { ...category, totalProductCount };
    }),
  };
}
