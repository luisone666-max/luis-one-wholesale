import { LoginForm } from "@/components/auth/LoginForm";
import { Container, MarketplaceShell } from "@/components/CustomerUi";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string }> }) {
  const params = await searchParams;

  return (
    <>
      <SiteHeader />
      <MarketplaceShell>
        <Container className="grid gap-8 py-10 lg:grid-cols-[1fr_440px]">
          <section className="rounded-sm bg-[#f65f18] p-8 text-white shadow-sm lg:p-10">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-100">Wholesale Account</p>
            <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight">Login to manage your wholesale orders.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-orange-50">
              Product prices stay public. Login is only required when adding items to your order list, checking out, and viewing order history.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Public prices", "Order history", "Manual confirmation"].map((item) => (
                <div key={item} className="rounded-sm bg-white/12 p-4 text-sm font-black ring-1 ring-white/25">{item}</div>
              ))}
            </div>
          </section>
          <LoginForm registered={params.registered === "1"} />
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
