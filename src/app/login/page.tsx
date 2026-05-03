import { LoginForm } from "@/components/auth/LoginForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string }> }) {
  const params = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="bg-zinc-50">
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
          <div className="rounded-md bg-[#f65f18] p-8 text-white lg:p-10">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-100">Buyer login mockup</p>
            <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight">Login before placing wholesale orders.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-orange-50">
              Browsing products and public tier prices does not require login. Order placement will require an account
              in a future version.
            </p>
          </div>

          <LoginForm registered={params.registered === "1"} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
