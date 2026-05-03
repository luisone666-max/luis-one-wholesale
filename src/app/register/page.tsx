import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const businessTypes = ["Reseller", "Shop Owner", "Online Seller", "Walk-in Buyer", "Other"];

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

          <form className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-zinc-950">Create Account</h2>
            <p className="mt-2 text-sm text-zinc-600">Mock form only. No account will be created yet.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" />
              <Field label="Phone Number" />
              <Field label="Facebook / Messenger Name" />
              <Field label="Location" />
              <label className="block text-sm font-bold text-zinc-800 sm:col-span-2">
                Business Type
                <select className="mt-2 h-12 w-full rounded-md border border-zinc-200 bg-white px-4 outline-none focus:border-orange-500">
                  {businessTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <Field label="Password" type="password" />
              <Field label="Confirm Password" type="password" />
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
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Field({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <label className="block text-sm font-bold text-zinc-800">
      {label}
      <input type={type} className="mt-2 h-12 w-full rounded-md border border-zinc-200 px-4 outline-none focus:border-orange-500" />
    </label>
  );
}
