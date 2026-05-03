"use client";

import type { ReactNode } from "react";
import type { TranslationKey } from "@/lib/admin-i18n";
import { useAdminI18n } from "@/components/admin/AdminShell";

export function AdminPageTitle({ titleKey, caption }: { titleKey: TranslationKey; caption?: string }) {
  const { t } = useAdminI18n();

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">WholesaleHub</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">{t(titleKey)}</h1>
        {caption ? <p className="mt-2 text-sm leading-6 text-zinc-500">{caption}</p> : null}
      </div>
    </div>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "orange" | "green" | "neutral" }) {
  const classes = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
  };

  return <span className={`rounded px-2 py-1 text-xs font-black ring-1 ${classes[tone]}`}>{children}</span>;
}

export function AdminToggle({ checked }: { checked: boolean }) {
  return (
    <span className={`inline-flex h-6 w-11 items-center rounded-full p-1 ${checked ? "bg-[#f65f18]" : "bg-zinc-300"}`}>
      <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
    </span>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">{children}</div>;
}

export function Pager() {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-white px-4 py-3">
      {[1, 2, 3].map((page) => (
        <button
          key={page}
          type="button"
          className={`h-9 w-9 rounded-md text-sm font-black ${
            page === 1 ? "bg-[#f65f18] text-white" : "border border-zinc-200 text-zinc-700"
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
}
