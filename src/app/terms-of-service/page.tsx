import type { Metadata } from "next";
import { Container, MarketplaceShell } from "@/components/CustomerUi";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderServer as SiteHeader } from "@/components/SiteHeaderServer";
import { businessInfo } from "@/lib/business-info";

export const metadata: Metadata = {
  title: "Terms of Service | Luis One Supply Hub",
  description: "Terms of service for browsing products, customer accounts, and wholesale order requests on Luis One Supply Hub.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <SiteHeader />
      <MarketplaceShell>
        <Container className="py-8 sm:py-12">
          <article className="mx-auto max-w-4xl rounded-sm border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Luis One Supply Hub</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Terms of Service</h1>
            <p className="mt-2 text-sm font-bold text-zinc-500">Last updated: May 28, 2026</p>

            <div className="mt-8 space-y-7 text-sm leading-7 text-zinc-700">
              <section>
                <h2 className="text-lg font-black text-zinc-950">Wholesale Website Use</h2>
                <p className="mt-2">
                  Luis One Supply Hub provides a catalog and order request system for motorcycle helmets, accessories, top boxes,
                  parts, and practical reseller products. Product listings, prices, stock, options, and delivery availability may
                  change and are confirmed manually by our team.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-black text-zinc-950">Orders and Confirmation</h2>
                <p className="mt-2">
                  Submitting an order on this website is an order request. Your order is not final until our team confirms stock,
                  quantity, pricing, deposit or payment instructions, pickup, Lalamove, or J&amp;T Express COD arrangements.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-black text-zinc-950">Accounts</h2>
                <p className="mt-2">
                  Customers are responsible for providing accurate contact, delivery, and account information. We may refuse or
                  cancel requests that appear fraudulent, abusive, incomplete, or inconsistent with our wholesale process.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-black text-zinc-950">Delivery and Pickup</h2>
                <p className="mt-2">
                  Store pickup, manual Lalamove, and J&amp;T Express COD are arranged based on product availability, destination,
                  package size, courier service coverage, and manual confirmation. Delivery times and courier fees may vary.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-black text-zinc-950">Contact</h2>
                <p className="mt-2">
                  Questions about orders or these terms can be sent to{" "}
                  <a className="font-black text-orange-700" href={businessInfo.facebookUrl} target="_blank" rel="noreferrer">
                    our Facebook Page
                  </a>{" "}
                  or by calling{" "}
                  <a className="font-black text-orange-700" href={`tel:${businessInfo.phoneTel}`}>
                    {businessInfo.phoneDisplay}
                  </a>
                  .
                </p>
              </section>
            </div>
          </article>
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
