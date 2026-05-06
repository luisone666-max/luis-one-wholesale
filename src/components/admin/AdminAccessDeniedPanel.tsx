import Link from "next/link";

type AdminAccessDeniedPanelProps = {
  eyebrow?: string;
  title: string;
  message: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function AdminAccessDeniedPanel({
  eyebrow = "Access restricted",
  title,
  message,
  primaryHref = "/admin/sales-desk",
  primaryLabel = "Open Sales Desk",
  secondaryHref = "/admin",
  secondaryLabel = "Back to Dashboard",
}: AdminAccessDeniedPanelProps) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-black text-zinc-950">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-amber-900">{message}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={primaryHref} className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-black text-white">
          {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className="rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-black text-amber-800"
        >
          {secondaryLabel}
        </Link>
      </div>
    </section>
  );
}
