import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, MarketplaceShell, MessengerButton, PrimaryButton, SecondaryButton } from "@/components/CustomerUi";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderServer as SiteHeader } from "@/components/SiteHeaderServer";
import { getSiteUrl, siteName } from "@/lib/seo";
import { getSeoGuide, seoGuideJsonLd, seoGuides } from "@/lib/seo-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return seoGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getSeoGuide(slug);

  if (!guide) {
    return {};
  }

  return {
    title: `${guide.title} | ${siteName}`,
    description: guide.description,
    keywords: guide.keywords,
    alternates: {
      canonical: `/wholesale-guides/${guide.slug}`,
    },
    openGraph: {
      title: `${guide.title} | ${siteName}`,
      description: guide.description,
      url: `${getSiteUrl()}/wholesale-guides/${guide.slug}`,
      siteName,
      type: "article",
      images: [
        {
          url: "/brand/luis-one-logo.jpg",
          width: 1200,
          height: 1200,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${guide.title} | ${siteName}`,
      description: guide.description,
      images: ["/brand/luis-one-logo.jpg"],
    },
  };
}

export default async function WholesaleGuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getSeoGuide(slug);

  if (!guide) {
    notFound();
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seoGuideJsonLd(guide)) }} />
      <SiteHeader />
      <MarketplaceShell>
        <article className="border-b border-orange-100 bg-white">
          <Container className="py-8 sm:py-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">{guide.eyebrow}</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-zinc-950 sm:text-5xl">{guide.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">{guide.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {guide.keywords.map((keyword) => (
                <span key={keyword} className="rounded-sm bg-orange-50 px-2.5 py-1.5 text-xs font-black text-orange-700 ring-1 ring-orange-100">
                  {keyword}
                </span>
              ))}
            </div>
          </Container>
        </article>

        <Container className="py-6 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {guide.sections.map((section) => (
                <section key={section.heading} className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-2xl font-black text-zinc-950">{section.heading}</h2>
                  <div className="mt-4 space-y-4 text-base leading-7 text-zinc-600">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <aside className="h-fit rounded-sm border border-orange-200 bg-white p-5 shadow-sm lg:sticky lg:top-32">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Luis One Supply Hub</p>
              <h2 className="mt-3 text-xl font-black text-zinc-950">{guide.ctaTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{guide.ctaText}</p>
              <div className="mt-5 grid gap-2">
                <PrimaryButton href="/category/all">View Products</PrimaryButton>
                <SecondaryButton href="/register">Create Account</SecondaryButton>
                <MessengerButton label="Chat on Messenger" />
              </div>
            </aside>
          </div>
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
