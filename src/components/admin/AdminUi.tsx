"use client";

import type { ReactNode } from "react";
import type { TranslationKey } from "@/lib/admin-i18n";
import { useAdminI18n } from "@/components/admin/AdminShell";

export function AdminPageTitle({ titleKey, caption }: { titleKey: TranslationKey; caption?: string }) {
  const { t } = useAdminI18n();

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Luis One Supply Hub</p>
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

export function AdminOperationGuide({
  label,
  title,
  body,
  steps,
  warning,
  tone = "orange",
}: {
  label: string;
  title: string;
  body: string;
  steps: string[];
  warning?: string;
  tone?: "orange" | "green" | "neutral";
}) {
  const toneClass = {
    green: {
      section: "border-emerald-200 bg-emerald-50",
      label: "text-emerald-700",
      title: "text-emerald-950",
      text: "text-emerald-900",
      step: "ring-emerald-100 text-emerald-900",
      warning: "border-emerald-200 bg-white text-emerald-800",
    },
    neutral: {
      section: "border-zinc-200 bg-zinc-50",
      label: "text-zinc-600",
      title: "text-zinc-950",
      text: "text-zinc-700",
      step: "ring-zinc-200 text-zinc-800",
      warning: "border-zinc-200 bg-white text-zinc-700",
    },
    orange: {
      section: "border-orange-200 bg-orange-50",
      label: "text-orange-700",
      title: "text-orange-950",
      text: "text-orange-900",
      step: "ring-orange-100 text-orange-900",
      warning: "border-orange-200 bg-white text-orange-800",
    },
  }[tone];

  return (
    <section className={`rounded-lg border p-4 ${toneClass.section}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.16em] ${toneClass.label}`}>{label}</p>
          <h2 className={`mt-1 text-base font-black ${toneClass.title}`}>{title}</h2>
          <p className={`mt-2 text-sm font-bold leading-6 ${toneClass.text}`}>{body}</p>
          {warning ? <p className={`mt-3 rounded-md border px-3 py-2 text-xs font-black leading-5 ${toneClass.warning}`}>{warning}</p> : null}
        </div>
        <div className="grid min-w-0 gap-2 text-sm font-black sm:grid-cols-3 lg:min-w-[520px]">
          {steps.map((step) => (
            <span key={step} className={`rounded-md bg-white px-3 py-2 ring-1 ${toneClass.step}`}>
              {step}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
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
