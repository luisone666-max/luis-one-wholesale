import { RegisterForm } from "@/components/auth/RegisterForm";
import { Container, MarketplaceShell } from "@/components/CustomerUi";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderServer as SiteHeader } from "@/components/SiteHeaderServer";

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <MarketplaceShell>
        <Container className="grid gap-8 py-10 lg:grid-cols-[1fr_540px]">
          <section className="rounded-sm bg-[#f65f18] p-8 text-white shadow-sm lg:p-10">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-100">Create Wholesale Account</p>
            <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight">Register to place wholesale orders.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-orange-50">
              Use your real contact details so our team can confirm product availability, deposit instructions, pick-up, Lalamove, or courier arrangements.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["No online payment", "Freight collect", "Messenger support"].map((item) => (
                <div key={item} className="rounded-sm bg-white/12 p-4 text-sm font-black ring-1 ring-white/25">{item}</div>
              ))}
            </div>
          </section>
          <RegisterForm />
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
