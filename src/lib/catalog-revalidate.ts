import "server-only";

import { revalidatePath } from "next/cache";

export function revalidateCatalogPages() {
  revalidatePath("/");
  revalidatePath("/category/all");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/product/[slug]", "page");
  revalidatePath("/admin/products");
}
