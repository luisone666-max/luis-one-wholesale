import type { Metadata } from "next";
import { ShareRedirect } from "@/components/ShareRedirect";
import { getCatalogProductPage } from "@/lib/catalog-data";
import { getPriceRange } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const productionSiteUrl = "https://luisonesupplyhub.com";

function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const isProduction = process.env.NODE_ENV === "production";
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const siteUrl = configuredUrl && !configuredUrl.includes("supabase.co") && !configuredUrl.includes("luis-one-wholesale.vercel.app")
    ? configuredUrl
    : isProduction
      ? productionSiteUrl
      : vercelUrl
        ? `https://${vercelUrl}`
        : productionSiteUrl;

  return siteUrl.replace(/\/$/, "");
}

function absoluteUrl(pathOrUrl: string | undefined) {
  const fallback = "/brand/luis-one-logo.jpg";
  const value = pathOrUrl || fallback;

  if (value.toLowerCase().endsWith(".svg")) {
    return `${getSiteUrl()}${fallback}`;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${getSiteUrl()}${value.startsWith("/") ? value : `/${value}`}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getCatalogProductPage(slug);
  const product = catalog.data.product;
  const siteUrl = getSiteUrl();
  const shareUrl = `${siteUrl}/share/product/${slug}`;

  if (!product) {
    return {
      title: "Luis One Supply Hub | Wholesale Ordering",
      description: "Wholesale supply for resellers and shops with public tier pricing.",
      alternates: {
        canonical: shareUrl,
      },
      openGraph: {
        title: "Luis One Supply Hub | Wholesale Ordering",
        description: "Wholesale supply for resellers and shops with public tier pricing.",
        url: shareUrl,
        siteName: "Luis One Supply Hub",
        type: "website",
        images: [
          {
            url: absoluteUrl("/brand/luis-one-logo.jpg"),
            width: 1200,
            height: 1200,
            alt: "Luis One Supply Hub",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Luis One Supply Hub | Wholesale Ordering",
        description: "Wholesale supply for resellers and shops with public tier pricing.",
        images: [absoluteUrl("/brand/luis-one-logo.jpg")],
      },
    };
  }

  const priceRange = getPriceRange(product);
  const title = `${product.name} | ${priceRange}`;
  const description = `${product.category} wholesale item. MOQ ${product.moq} pc. Price range: ${priceRange}.`;
  const image = absoluteUrl(product.image);

  return {
    title,
    description,
    alternates: {
      canonical: shareUrl,
    },
    openGraph: {
      title,
      description,
      url: shareUrl,
      siteName: "Luis One Supply Hub",
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 1200,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductSharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const productUrl = `/product/${slug}`;

  return <ShareRedirect productUrl={productUrl} />;
}
