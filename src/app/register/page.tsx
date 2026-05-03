import { RegisterForm } from "@/components/auth/RegisterForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-zinc-50">
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_520px] lg:px-8">
          <div className="rounded-md bg-[#f65f18] p-8 text-white lg:p-10">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-100">Wholesale buyer account</p>
            <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight">Register to place wholesale orders.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-orange-50">
              Product prices stay public. Registration is only needed when you are ready to request an order for manual
              confirmation, deposit, and shipping arrangement.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {["Public prices", "Manual confirmation", "No online payment"].map((item) => (
                <div key={item} className="rounded-md bg-white/12 p-4 ring-1 ring-white/25">
                  <p className="text-sm font-black">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <RegisterForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
