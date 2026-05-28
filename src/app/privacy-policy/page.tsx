import type { Metadata } from "next";
import { Container, MarketplaceShell } from "@/components/CustomerUi";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderServer as SiteHeader } from "@/components/SiteHeaderServer";
import { businessInfo } from "@/lib/business-info";

export const metadata: Metadata = {
  title: "Privacy Policy | Luis One Supply Hub",
  description: "Privacy policy for Luis One Supply Hub customer accounts, orders, delivery coordination, and customer support.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <MarketplaceShell>
        <Container className="py-8 sm:py-12">
          <article className="mx-auto max-w-4xl rounded-sm border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Luis One Supply Hub</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Privacy Policy</h1>
            <p className="mt-2 text-sm font-bold text-zinc-500">Last updated: May 28, 2026</p>

            <div className="mt-8 space-y-7 text-sm leading-7 text-zinc-700">
              <section>
                <h2 className="text-lg font-black text-zinc-950">Information We Collect</h2>
                <p className="mt-2">
                  We collect the information you provide when you create a customer account, sign in with Google or Facebook,
                  build an order list, submit an order, save delivery details, or contact us through Messenger, phone, or our
                  Facebook Page. This may include your name, email address, phone number, delivery address, order details,
                  delivery notes, and messages related to your order.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-black text-zinc-950">How We Use Information</h2>
                <p className="mt-2">
                  We use customer information to confirm product availability, prepare wholesale orders, coordinate store pickup,
                  manual Lalamove arrangements, J&amp;T Express COD shipments, payment confirmation, customer support, account
                  access, fraud prevention, and basic store operations.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-black text-zinc-950">Social Login</h2>
                <p className="mt-2">
                  If you use Google or Facebook sign in, we receive the basic account information allowed by that provider, such
                  as your name, email address, and account identifier. We use this only to create or access your Luis One Supply
                  Hub customer account.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-black text-zinc-950">Sharing Information</h2>
                <p className="mt-2">
                  We do not sell customer personal information. We may share order and delivery details only when needed with
                  service providers involved in the order, such as J&amp;T Express, Lalamove, payment or hosting providers, and
                  customer support tools.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-black text-zinc-950">Data Retention and Deletion</h2>
                <p className="mt-2">
                  We keep order and account information as needed for customer support, business records, fraud prevention, and
                  legal or tax requirements. You may request account data deletion by following our data deletion instructions.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-black text-zinc-950">Contact</h2>
                <p className="mt-2">
                  For privacy questions or data requests, contact {businessInfo.name} at{" "}
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
