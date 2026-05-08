import Link from "next/link";
import type { Metadata } from "next";
import { Container, MarketplaceShell } from "@/components/CustomerUi";
import { DataSourceNotice } from "@/components/DataSourceNotice";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailExperience } from "@/components/ProductDetailExperience";
import { ResellerImages } from "@/components/ResellerImages";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderServer as SiteHeader } from "@/components/SiteHeaderServer";
import { getCatalogProductPage } from "@/lib/catalog-data";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  getSiteUrl,
  productJsonLd,
  productPageTitle,
  productSeoDescription,
} from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getCatalogProductPage(slug);
  const product = catalog.data.product;

  if (!product) {
    const url = `${getSiteUrl()}/product/${slug}`;

    return {
      title: "Product not found | Luis One Supply Hub",
      description: "Browse current wholesale products from Luis One Supply Hub.",
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: "Luis One Supply Hub | Wholesale Ordering",
        description: "Browse current wholesale products from Luis One Supply Hub.",
        url,
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
        description: "Browse current wholesale products from Luis One Supply Hub.",
        images: [absoluteUrl("/brand/luis-one-logo.jpg")],
      },
    };
  }

  const title = productPageTitle(product);
  const description = productSeoDescription(product);
  const url = `${getSiteUrl()}/product/${product.slug}`;
  const image = absoluteUrl(product.image);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
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

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogProductPage(slug);
  const { product, related } = catalog.data;

  if (!product) {
    return (
      <>
        <SiteHeader />
        <DataSourceNotice message={catalog.message} />
        <MarketplaceShell>
          <Container className="py-10">
            <div className="mx-auto max-w-2xl rounded-sm border border-zinc-200 bg-white p-8 text-center shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Product unavailable</p>
              <h1 className="mt-3 text-3xl font-black text-zinc-950">This product is no longer available</h1>
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                This item may have been hidden, deleted, or replaced. Please browse the current wholesale catalog or contact
                us on Messenger for help finding the right product.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/category/all"
                  className="rounded-sm bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-orange-700"
                >
                  Browse Products
                </Link>
                <Link
                  href="/"
                  className="rounded-sm border border-zinc-200 bg-white px-5 py-3 text-sm font-black text-zinc-900 hover:border-orange-200 hover:text-orange-700"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </Container>
        </MarketplaceShell>
        <SiteFooter />
      </>
    );
  }

  const structuredData = [
    productJsonLd(product),
    breadcrumbJsonLd([
      { name: "Home", url: getSiteUrl() },
      { name: product.category, url: `${getSiteUrl()}/category/${product.categorySlug}` },
      { name: product.name, url: `${getSiteUrl()}/product/${product.slug}` },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SiteHeader />
      <DataSourceNotice message={catalog.message} />
      <MarketplaceShell>
        <Container className="py-6">
          <div className="mb-4 text-sm font-bold text-zinc-500">
            <Link href="/" className="hover:text-orange-700">Home</Link> /{" "}
            <Link href={`/category/${product.categorySlug}`} className="hover:text-orange-700">{product.category}</Link> /{" "}
            <span className="text-zinc-900">{product.name}</span>
          </div>

          <ProductDetailExperience product={product} />

          <section className="mt-6 rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-zinc-950">Product Description</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600">{product.description}</p>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-zinc-600 sm:grid-cols-2">
              {product.details.map((detail) => <li key={detail} className="rounded-sm bg-zinc-50 px-3 py-2">- {detail}</li>)}
            </ul>
          </section>

          <ResellerImages product={product} />

          {related.length ? (
            <section className="mt-8">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Related Products</p>
                  <h2 className="mt-1 text-2xl font-black text-zinc-950">More wholesale items</h2>
                </div>
                <Link href={`/category/${product.categorySlug}`} className="text-sm font-black text-orange-700">View category</Link>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {related.map((item) => <ProductCard key={item.slug} product={item} />)}
              </div>
            </section>
          ) : null}
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
