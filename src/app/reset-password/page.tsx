import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Container, MarketplaceShell } from "@/components/CustomerUi";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function ResetPasswordPage() {
  return (
    <>
      <SiteHeader />
      <MarketplaceShell>
        <Container className="grid gap-8 py-10 lg:grid-cols-[1fr_440px]">
          <section className="rounded-sm bg-[#f65f18] p-8 text-white shadow-sm lg:p-10">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-100">Wholesale Account</p>
            <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight">Reset your account password.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-orange-50">
              Use the reset link from your email, then set a new password to continue managing wholesale orders.
            </p>
          </section>
          <ResetPasswordForm />
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
