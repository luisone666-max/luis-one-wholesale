import { SiteHeaderClient } from "@/components/SiteHeaderClient";
import { getCatalogNavigationCategories } from "@/lib/catalog-data";

export async function SiteHeaderServer() {
  const categories = await getCatalogNavigationCategories();

  return <SiteHeaderClient initialCategories={categories} />;
}
