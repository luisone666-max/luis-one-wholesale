import { headers } from "next/headers";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Container, MarketplaceShell } from "@/components/CustomerUi";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderServer as SiteHeader } from "@/components/SiteHeaderServer";

function normalizeRegisterRedirect(value: string | undefined) {
  const target = typeof value === "string" ? value.trim() : "";

  if (!target || !target.startsWith("/") || target.startsWith("//") || target.includes("\\") || /[\r\n]/.test(target)) {
    return "/member";
  }

  return target;
}

function getRequestOrigin(headerList: { get(name: string): string | null }) {
  const host = (headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "").split(",")[0]?.trim();

  if (!host) {
    return undefined;
  }

  const protocolFromHeader = (headerList.get("x-forwarded-proto") ?? "").split(",")[0]?.trim();
  const protocol = protocolFromHeader || (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");

  return `${protocol}://${host}`;
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const params = await searchParams;
  const siteOrigin = getRequestOrigin(await headers());
  const redirectPath = normalizeRegisterRedirect(params.redirect);
  const isCheckoutFlow = redirectPath === "/checkout" || redirectPath === "/cart";

  return (
    <>
      <SiteHeader />
      <MarketplaceShell>
        <Container className={isCheckoutFlow ? "max-w-2xl py-8" : "grid gap-8 py-10 lg:grid-cols-[1fr_540px]"}>
          {isCheckoutFlow ? (
            <section className="rounded-sm border border-orange-100 bg-orange-50 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">Secure checkout</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Create an account to continue.</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-zinc-600">
                After registration, login once and we will return you to {redirectPath === "/cart" ? "your order cart" : "checkout"}.
              </p>
            </section>
          ) : (
            <section className="rounded-sm bg-[#f65f18] p-8 text-white shadow-sm lg:p-10">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-100">Create Wholesale Account</p>
              <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight">Register to place wholesale orders.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-orange-50">
                Use your real contact details so our team can confirm product availability, deposit instructions, pick-up, Lalamove, or courier arrangements.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {["No online payment", "J&T / Pickup / Lalamove", "Messenger support"].map((item) => (
                  <div key={item} className="rounded-sm bg-white/12 p-4 text-sm font-black ring-1 ring-white/25">{item}</div>
                ))}
              </div>
            </section>
          )}
          <RegisterForm redirectPath={redirectPath} siteOrigin={siteOrigin} />
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
