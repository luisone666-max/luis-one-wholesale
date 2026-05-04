import type { Metadata } from "next";
import Link from "next/link";
import { Container, MarketplaceShell, PrimaryButton } from "@/components/CustomerUi";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { seoGuides } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: "Wholesale Guides | Luis One Supply Hub",
  description:
    "Helpful wholesale ordering guides for Philippine resellers and shop owners buying from Luis One Supply Hub.",
  alternates: {
    canonical: "/wholesale-guides",
  },
  openGraph: {
    title: "Wholesale Guides | Luis One Supply Hub",
    description:
      "Learn about wholesale ordering, motorcycle parts, freight collect, Lalamove, courier, pickup, and reseller buying in the Philippines.",
    url: "/wholesale-guides",
    siteName: "Luis One Supply Hub",
    type: "website",
  },
};

export default function WholesaleGuidesPage() {
  return (
    <>
      <SiteHeader />
      <MarketplaceShell>
        <section className="border-b border-orange-100 bg-white">
          <Container className="py-8 sm:py-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Wholesale Learning Center</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Wholesale guides for resellers and shop owners
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
              Practical English content pages that explain how Luis One Supply Hub works: public wholesale prices,
              MOQ, order lists, manual confirmation, pickup, Lalamove, courier shipping, and freight collect.
            </p>
            <PrimaryButton href="/category/all" className="mt-6">
              Browse Products
            </PrimaryButton>
          </Container>
        </section>

        <Container className="py-6 sm:py-8">
          <div className="grid gap-4 md:grid-cols-2">
            {seoGuides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/wholesale-guides/${guide.slug}`}
                className="group rounded-sm border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">{guide.eyebrow}</p>
                <h2 className="mt-3 text-xl font-black leading-snug text-zinc-950 group-hover:text-orange-700">{guide.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">{guide.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {guide.keywords.slice(0, 2).map((keyword) => (
                    <span key={keyword} className="rounded-sm bg-orange-50 px-2 py-1 text-[11px] font-black text-orange-700">
                      {keyword}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
