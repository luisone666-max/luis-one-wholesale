import type { MetadataRoute } from "next";
import { getCatalogSnapshot } from "@/lib/catalog-data";
import { getSiteUrl } from "@/lib/seo";
import { seoGuides } from "@/lib/seo-content";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const catalog = await getCatalogSnapshot();
  const now = new Date();

  const categoryUrls = [
    `${siteUrl}/category/all`,
    ...catalog.data.allCategoryRows.map((category) => `${siteUrl}/category/${category.slug}`),
  ];
  const productUrls = catalog.data.products.map((product) => `${siteUrl}/product/${product.slug}`);
  const guideUrls = [`${siteUrl}/wholesale-guides`, ...seoGuides.map((guide) => `${siteUrl}/wholesale-guides/${guide.slug}`)];

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...Array.from(new Set(categoryUrls)).map((url) => ({
      url,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...Array.from(new Set(productUrls)).map((url) => ({
      url,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...guideUrls.map((url) => ({
      url,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
