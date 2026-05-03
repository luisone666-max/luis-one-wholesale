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
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-100">Account access mockup</p>
            <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight">Login is reserved for placing wholesale orders later.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-orange-50">
              Buyers can browse all products and tier prices without signing in. This screen is a frontend-only mockup
              and does not authenticate or connect to a database.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {["Browse prices", "Build order cart", "Manual confirmation"].map((item) => (
                <div key={item} className="rounded-md bg-white/12 p-4 ring-1 ring-white/25">
                  <p className="text-sm font-black">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-zinc-950">Buyer Login</h2>
            <p className="mt-2 text-sm text-zinc-600">Mock form only. No login will be submitted.</p>
            <form className="mt-6 space-y-4">
              <label className="block text-sm font-bold text-zinc-800">
                Email address
                <input
                  type="email"
                  placeholder="buyer@company.com"
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
            <p className="mt-5 text-center text-sm text-zinc-600">
              New wholesale buyer?{" "}
              <Link href="/register" className="font-black text-orange-700">
                Register account
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
