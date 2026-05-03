"use client";

import { AdminShell, useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPageTitle } from "@/components/admin/AdminUi";

function SettingsContent() {
  const { t } = useAdminI18n();
  const fields = [
    { key: "storeName" as const, value: "WholesaleHub B2B Supply" },
    { key: "facebookPageUrl" as const, value: "https://facebook.com/wholesalehub" },
    { key: "messengerUrl" as const, value: "https://m.me/wholesalehub" },
    { key: "phoneNumber" as const, value: "+63 900 000 0000" },
    { key: "storeAddress" as const, value: "Warehouse District, Metro Manila" },
  ];

  return (
    <>
      <AdminPageTitle titleKey="settings" />
      <form className="max-w-3xl rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4">
          {fields.map((field) => (
            <label key={field.key} className="block text-sm font-bold text-zinc-800">
              {t(field.key)}
              <input
                value={field.value}
                readOnly
                className="mt-2 h-12 w-full rounded-md border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-700 outline-none"
              />
            </label>
          ))}
        </div>
      </form>
    </>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <SettingsContent />
    </AdminShell>
  );
}
