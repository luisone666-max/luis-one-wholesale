import type { Metadata } from "next";
import { Container, MarketplaceShell } from "@/components/CustomerUi";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderServer as SiteHeader } from "@/components/SiteHeaderServer";
import { businessInfo } from "@/lib/business-info";

export const metadata: Metadata = {
  title: "Data Deletion Instructions | Luis One Supply Hub",
  description: "Instructions for requesting deletion of Luis One Supply Hub customer account data.",
};

export default function DataDeletionPage() {
  return (
    <>
      <SiteHeader />
      <MarketplaceShell>
        <Container className="py-8 sm:py-12">
          <article className="mx-auto max-w-4xl rounded-sm border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Luis One Supply Hub</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Data Deletion Instructions</h1>
            <p className="mt-2 text-sm font-bold text-zinc-500">Last updated: May 28, 2026</p>

            <div className="mt-8 space-y-7 text-sm leading-7 text-zinc-700">
              <section>
                <h2 className="text-lg font-black text-zinc-950">How to Request Deletion</h2>
                <p className="mt-2">
                  To request deletion of your Luis One Supply Hub customer account data, send us a message through our Facebook
                  Page or Messenger with the subject &quot;Data deletion request&quot; and include the email address or phone number used
                  for your customer account.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-black text-zinc-950">What We Delete</h2>
                <p className="mt-2">
                  After verifying the request, we will delete or anonymize customer profile information that is no longer needed
                  for active order support, business records, fraud prevention, legal requirements, or tax compliance.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-black text-zinc-950">Processing Time</h2>
                <p className="mt-2">
                  We aim to review deletion requests within 30 days. If an order is still active, we may need to finish the order
                  support process before deleting or anonymizing related data.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-black text-zinc-950">Contact</h2>
                <p className="mt-2">
                  Send requests to{" "}
                  <a className="font-black text-orange-700" href={businessInfo.facebookUrl} target="_blank" rel="noreferrer">
                    our Facebook Page
                  </a>{" "}
                  or call{" "}
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
