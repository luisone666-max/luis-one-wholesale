import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function LoginPage() {
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

          <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-zinc-950">Buyer Login</h2>
            <p className="mt-2 text-sm text-zinc-600">Mock form only. No authentication will run.</p>
            <form className="mt-6 space-y-4">
              <label className="block text-sm font-bold text-zinc-800">
                Phone Number or Email
                <input
                  placeholder="Phone number or email"
                  className="mt-2 h-12 w-full rounded-md border border-zinc-200 px-4 outline-none focus:border-orange-500"
                />
              </label>
              <label className="block text-sm font-bold text-zinc-800">
                Password
                <input
                  type="password"
                  placeholder="Enter password"
                  className="mt-2 h-12 w-full rounded-md border border-zinc-200 px-4 outline-none focus:border-orange-500"
                />
              </label>
              <button type="button" className="h-12 w-full rounded-md bg-[#f65f18] text-sm font-black text-white">
                Login Mockup
              </button>
            </form>
            <div className="mt-5 flex items-center justify-between text-sm">
              <Link href="/register" className="font-black text-orange-700">
                Create Account
              </Link>
              <button type="button" className="font-bold text-zinc-500">
                Forgot Password
              </button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
