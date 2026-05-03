import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-zinc-50">
        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 rounded-md border border-orange-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Buyer onboarding mockup</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Register wholesale account</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
              This is a static frontend screen for future buyer registration. Product browsing remains public.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <form className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-zinc-800">
                  Company name
                  <input className="mt-2 h-12 w-full rounded-md border border-zinc-200 px-4 outline-none focus:border-orange-500" />
                </label>
                <label className="block text-sm font-bold text-zinc-800">
                  Buyer name
                  <input className="mt-2 h-12 w-full rounded-md border border-zinc-200 px-4 outline-none focus:border-orange-500" />
                </label>
                <label className="block text-sm font-bold text-zinc-800">
                  Email address
                  <input type="email" className="mt-2 h-12 w-full rounded-md border border-zinc-200 px-4 outline-none focus:border-orange-500" />
                </label>
                <label className="block text-sm font-bold text-zinc-800">
                  Phone number
                  <input className="mt-2 h-12 w-full rounded-md border border-zinc-200 px-4 outline-none focus:border-orange-500" />
                </label>
                <label className="block text-sm font-bold text-zinc-800 sm:col-span-2">
                  Business address
                  <input className="mt-2 h-12 w-full rounded-md border border-zinc-200 px-4 outline-none focus:border-orange-500" />
                </label>
                <label className="block text-sm font-bold text-zinc-800">
                  Password
                  <input type="password" className="mt-2 h-12 w-full rounded-md border border-zinc-200 px-4 outline-none focus:border-orange-500" />
                </label>
                <label className="block text-sm font-bold text-zinc-800">
                  Confirm password
                  <input type="password" className="mt-2 h-12 w-full rounded-md border border-zinc-200 px-4 outline-none focus:border-orange-500" />
                </label>
              </div>
              <button type="button" className="mt-6 h-12 w-full rounded-md bg-[#f65f18] text-sm font-black text-white">
                Register Mockup
              </button>
              <p className="mt-4 text-center text-sm text-zinc-600">
                Already have an account?{" "}
                <Link href="/login" className="font-black text-orange-700">
                  Login
                </Link>
              </p>
            </form>

            <aside className="h-fit rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-zinc-950">Future account use</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-600">
                <p>- Place wholesale order requests</p>
                <p>- Save company contact details</p>
                <p>- Receive manual order confirmation</p>
                <p>- No online payment in this version</p>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
