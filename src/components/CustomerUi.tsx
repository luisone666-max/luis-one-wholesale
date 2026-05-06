import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatMoney, type Category, type PriceTier, type Product } from "@/lib/mock-data";
import { businessInfo } from "@/lib/business-info";
import { getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/order-labels";

const facebookDirectChatUrl = businessInfo.messengerUrl;

export const messengerUrl = process.env.NEXT_PUBLIC_MESSENGER_URL?.includes("facebook.com/messages")
  ? process.env.NEXT_PUBLIC_MESSENGER_URL
  : facebookDirectChatUrl;

export function MarketplaceShell({ children }: { children: ReactNode }) {
  return <main className="bg-[#f6f6f6] text-zinc-950">{children}</main>;
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function PrimaryButton({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center justify-center rounded-sm bg-[#f65f18] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#df4f0d] ${className}`}>
      {children}
    </Link>
  );
}

export function SecondaryButton({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center justify-center rounded-sm border border-orange-200 bg-white px-5 py-3 text-sm font-black text-orange-700 transition hover:bg-orange-50 ${className}`}>
      {children}
    </Link>
  );
}

export function MessengerButton({ label = "Chat on Messenger", className = "" }: { label?: string; className?: string }) {
  return (
    <a
      href={messengerUrl}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center rounded-sm border border-orange-200 bg-white px-5 py-3 text-sm font-black text-orange-700 transition hover:bg-orange-50 ${className}`}
    >
      {label}
    </a>
  );
}

export function StockStatusBadge({ status }: { status: Product["stockStatus"] | string }) {
  const normalized = status === "In stock" ? "Ready Stock" : status === "Preorder" ? "For Order" : status;
  const tone =
    status === "Low stock"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : status === "Unavailable"
        ? "bg-zinc-100 text-zinc-500 ring-zinc-200"
        : status === "Preorder"
          ? "bg-sky-50 text-sky-700 ring-sky-200"
          : "bg-emerald-50 text-emerald-700 ring-emerald-200";

  return <span className={`inline-flex rounded-sm px-2 py-1 text-[11px] font-black ring-1 ${tone}`}>{normalized}</span>;
}

export function OrderStatusBadge({ type, status }: { type: "order" | "payment"; status: string }) {
  const label = type === "order" ? getOrderStatusLabel(status) : getPaymentStatusLabel(status);
  const tone = status.includes("completed") || status.includes("paid") || status.includes("verified")
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : status.includes("cancelled") || status.includes("rejected") || status.includes("refund")
      ? "bg-red-50 text-red-700 ring-red-200"
      : "bg-orange-50 text-orange-700 ring-orange-100";

  return <span className={`inline-flex rounded-sm px-2 py-1 text-xs font-black ring-1 ${tone}`}>{label}</span>;
}

export function EmptyState({ title, text, actionHref, actionLabel }: { title: string; text: string; actionHref: string; actionLabel: string }) {
  return (
    <div className="rounded-sm border border-dashed border-orange-200 bg-white p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-50 text-xl font-black text-[#f65f18]">!</div>
      <h2 className="mt-4 text-xl font-black text-zinc-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">{text}</p>
      <PrimaryButton href={actionHref} className="mt-5">{actionLabel}</PrimaryButton>
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="rounded-sm border border-zinc-200 bg-white p-6">
      <div className="h-2 w-28 animate-pulse rounded-full bg-orange-100" />
      <p className="mt-3 text-sm font-bold text-zinc-600">{label}</p>
    </div>
  );
}

export function PriceTierTable({ tiers }: { tiers: PriceTier[] }) {
  return (
    <div className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-orange-50 text-xs uppercase tracking-[0.12em] text-orange-700">
          <tr>
            <th className="px-4 py-3">Quantity</th>
            <th className="px-4 py-3">Unit Price</th>
            <th className="px-4 py-3">Tier Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {tiers.map((tier) => (
            <tr key={tier.label}>
              <td className="px-4 py-4 font-black text-zinc-950">{tier.label}</td>
              <td className="px-4 py-4 text-lg font-black text-[#f65f18]">{formatMoney(tier.price)}</td>
              <td className="px-4 py-4 text-zinc-600">{tier.max === null ? "Best bulk tier" : `Applies from ${tier.min} pcs`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => (
        <Link key={category.slug} href={`/category/${category.slug}`} className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-orange-50 via-white to-zinc-100 p-5">
            {category.image ? (
              <div
                role="img"
                aria-label={category.name}
                className="h-full w-full rounded-md bg-contain bg-center bg-no-repeat transition duration-200 group-hover:scale-[1.04]"
                style={{ backgroundImage: `url("${category.image}")` }}
              />
            ) : (
              <CategoryPlaceholder name={category.name} />
            )}
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black text-orange-700 shadow-sm">
              {category.itemCount} products
            </span>
          </div>
          <div className="p-4">
            <h3 className="line-clamp-1 text-base font-black text-zinc-950 group-hover:text-orange-700">{category.name}</h3>
            <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-600">{category.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function CategoryPlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-orange-200 bg-white/60">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f65f18] text-lg font-black text-white shadow-sm">
          {name.slice(0, 2).toUpperCase()}
        </span>
        <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-orange-700">Supply Category</p>
      </div>
    </div>
  );
}

export function ProductFilters({ categories, activeSlug }: { categories: Category[]; activeSlug: string }) {
  return (
    <aside className="h-fit rounded-sm border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-4 py-3">
        <p className="text-sm font-black text-zinc-950">Categories</p>
      </div>
      <div className="space-y-6 p-4">
        <div>
          <div className="max-h-[68vh] space-y-1 overflow-y-auto pr-1 text-sm">
            <FilterLink href="/category/all" active={activeSlug === "all"}>All Products</FilterLink>
            {categories.map((category) => (
              <FilterLink key={category.slug} href={`/category/${category.slug}`} active={activeSlug === category.slug} level={category.level ?? 1}>
                {category.name}
              </FilterLink>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function FilterLink({ href, active, children, level = 1 }: { href: string; active: boolean; children: ReactNode; level?: number }) {
  const indent = level === 1 ? "pl-3" : level === 2 ? "pl-6" : "pl-9";

  return (
    <Link href={href} className={`block rounded-sm py-2 pr-3 font-bold ${indent} ${active ? "bg-orange-50 text-[#f65f18]" : "text-zinc-600 hover:bg-zinc-50 hover:text-orange-700"}`}>
      {children}
    </Link>
  );
}

export function ProductImage({
  src,
  alt,
  className = "",
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw",
}: {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src={src || "/products/phone-accessories.svg"}
      alt={alt}
      width={520}
      height={520}
      sizes={sizes}
      priority={priority}
      className={`h-full w-full object-contain ${className}`}
    />
  );
}
