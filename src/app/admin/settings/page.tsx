import { AdminSettingsClient } from "@/components/admin/AdminSettingsClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const admin = await requireActiveAdminPage();

  if (admin.role !== "owner" && admin.role !== "admin") {
    redirect("/admin");
  }

  return (
    <AdminShell initialAdmin={admin}>
      <AdminSettingsClient />
    </AdminShell>
  );
}
