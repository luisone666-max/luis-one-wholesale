import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function OrderSuccessPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-zinc-50">
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-md border border-orange-100 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Order Received</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-950">Mock Order No: LO-2026-000001</h1>
            <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
              <Info label="Product Total" value="PHP 3,500" />
              <Info label="Shipping Fee Payment" value="Freight Collect / Paid by Receiver" />
              <Info label="Receiver Name" value="Juan Dela Cruz" />
              <Info label="Receiver Phone" value="+63 917 111 0001" />
              <Info label="Receiving Method" value="Courier shipping" />
              <Info label="Complete Address" value="Banawe Street, Quezon City, Metro Manila" />
            </div>
            <p className="mt-8 rounded-md border border-orange-200 bg-orange-50 p-4 text-sm font-bold leading-6 text-orange-700">
              We will contact you to confirm your order. Deposit may be required to secure your items. Shipping fee will
              be arranged manually.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/my-orders" className="rounded-md bg-[#f65f18] px-5 py-3 text-sm font-black text-white">
                View My Orders
              </Link>
              <Link href="https://m.me/" className="rounded-md border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-black text-orange-700">
                Chat on Messenger
              </Link>
              <Link href="/category/all" className="rounded-md border border-zinc-200 bg-white px-5 py-3 text-sm font-black text-zinc-700">
                Continue Shopping
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-50 p-4 ring-1 ring-zinc-100">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-2 font-black text-zinc-950">{value}</p>
    </div>
  );
}
