import Link from "next/link";
import Image from "next/image";
import { messengerUrl } from "@/components/CustomerUi";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-zinc-600 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-2 ring-orange-100">
              <Image src="/brand/luis-one-logo.jpg" alt="Luis One Supply Hub logo" width={48} height={48} className="h-full w-full object-cover" />
            </span>
            <div>
              <p className="text-xl font-black leading-5 text-zinc-950">Luis One</p>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">Supply Hub</p>
            </div>
          </div>
          <p className="mt-3 max-w-sm leading-6">
            Wholesale Supply for Resellers & Shops across motorcycle parts, daily essentials, electronics, food, and spices.
          </p>
          <p className="mt-4 font-black text-[#f65f18]">Orders are manually confirmed. No online payment is required on this website.</p>
        </div>
        <div>
          <p className="font-black text-zinc-950">Categories</p>
          <div className="mt-3 space-y-2">
            <Link href="/category/all" className="block hover:text-orange-700">All Products</Link>
            <Link href="/category/motorcycle-parts" className="block hover:text-orange-700">Motorcycle Parts</Link>
            <Link href="/category/electronics" className="block hover:text-orange-700">Electronics</Link>
            <Link href="/category/food-spices" className="block hover:text-orange-700">Food & Spices</Link>
          </div>
        </div>
        <div>
          <p className="font-black text-zinc-950">Wholesale Account</p>
          <div className="mt-3 space-y-2">
            <Link href="/cart" className="block hover:text-orange-700">Order List</Link>
            <Link href="/my-orders" className="block hover:text-orange-700">My Orders</Link>
            <Link href="/register" className="block hover:text-orange-700">Create Account</Link>
          </div>
        </div>
        <div>
          <p className="font-black text-zinc-950">Contact</p>
          <div className="mt-3 space-y-2">
            <a href={messengerUrl} target="_blank" rel="noreferrer" className="block hover:text-orange-700">Chat on Messenger</a>
            <p>Pick-up / Lalamove / Courier</p>
            <p>Store address: To be updated</p>
            <p>MOQ, deposit, and freight collect options are confirmed manually.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
