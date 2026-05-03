"use client";

import { AdminShell, useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPageTitle } from "@/components/admin/AdminUi";
import { dashboardStats } from "@/lib/admin-mock-data";

function ReportsContent() {
  const { t } = useAdminI18n();

  return (
    <>
      <AdminPageTitle titleKey="reports" />
      <section className="grid gap-4 md:grid-cols-3">
        {dashboardStats.slice(0, 6).map((stat) => (
          <div key={stat.key} className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-zinc-500">{t(stat.key)}</p>
            <p className="mt-3 text-2xl font-black text-zinc-950">{stat.value}</p>
            <div className="mt-5 flex h-24 items-end gap-2">
              {[42, 68, 54, 83, 76, 92].map((height, index) => (
                <div key={`${stat.key}-${index}`} className="flex-1 rounded-t bg-orange-100" style={{ height: `${height}%` }}>
                  <div className="h-full rounded-t bg-[#f65f18] opacity-70" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

export default function AdminReportsPage() {
  return (
    <AdminShell>
      <ReportsContent />
    </AdminShell>
  );
}
