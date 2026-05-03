import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">{eyebrow}</p> : null}
        <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">{title}</h2>
      </div>
      {action}
    </div>
  );
}
