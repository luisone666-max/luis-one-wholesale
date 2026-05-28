import type { Metadata } from "next";
import { ShareRedirect } from "@/components/ShareRedirect";
import { getCatalogProductPage } from "@/lib/catalog-data";
import { absoluteUrl, getSiteUrl, optimizedPublicImageUrl, productSeoDescription, productShareTitle } from "@/lib/seo";

export const revalidate = 600;

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

  const title = productShareTitle(product);
  const description = productSeoDescription(product);
  const image = optimizedPublicImageUrl(product.image);

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
