import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { messengerUrl } from "@/components/CustomerUi";
import { businessInfo } from "@/lib/business-info";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-zinc-600 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
          </div>
          <p className="mt-3 max-w-sm leading-6">
            {businessInfo.description}
          </p>
          <p className="mt-4 font-black text-[#f65f18]">Orders are manually confirmed. No online payment is required on this website.</p>
        </div>
        <div>
          <p className="font-black text-zinc-950">Categories</p>
          <div className="mt-3 space-y-2">
            <Link href="/category/all" className="block hover:text-orange-700">All Products</Link>
            <Link href="/category/automotive" className="block hover:text-orange-700">Automotive</Link>
            <Link href="/category/motorcycle-parts" className="block hover:text-orange-700">Motorcycle Parts</Link>
            <Link href="/category/electronics" className="block hover:text-orange-700">Electronics</Link>
          </div>
        </div>
        <div>
          <p className="font-black text-zinc-950">Wholesale Account</p>
          <div className="mt-3 space-y-2">
            <Link href="/cart" className="block hover:text-orange-700">Order List</Link>
            <Link href="/my-orders" className="block hover:text-orange-700">My Orders</Link>
            <Link href="/member" className="block hover:text-orange-700">Member Card</Link>
            <Link href="/register" className="block hover:text-orange-700">Create Account</Link>
            <Link href="/wholesale-guides" className="block hover:text-orange-700">Wholesale Guides</Link>
          </div>
        </div>
        <div>
          <p className="font-black text-zinc-950">Contact</p>
          <div className="mt-3 space-y-2">
            <a href={messengerUrl} target="_blank" rel="noreferrer" className="block hover:text-orange-700">Chat on Messenger</a>
            <a href={businessInfo.facebookUrl} target="_blank" rel="noreferrer" className="block hover:text-orange-700">Facebook Page</a>
            <a href={`tel:${businessInfo.phoneTel}`} className="block hover:text-orange-700">{businessInfo.phoneDisplay}</a>
            <p>{businessInfo.address}</p>
            <p>{businessInfo.hours}</p>
            <p>Pick-up / Lalamove / Courier</p>
            <p>MOQ, deposit, and freight collect options are confirmed manually.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
