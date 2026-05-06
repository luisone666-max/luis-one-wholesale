import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_CACHE_TAG } from "@/lib/catalog-data";

export function revalidateCatalogPages() {
  revalidateTag(CATALOG_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/category/all");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/product/[slug]", "page");
  revalidatePath("/share/product/[slug]", "page");
  revalidatePath("/meta/catalog-feed.csv");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
}
