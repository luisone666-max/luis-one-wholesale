import { AdminOwnerClient } from "@/components/admin/AdminOwnerClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireActiveAdminPage } from "@/lib/admin-auth";

export default async function AdminOwnerPage() {
  await requireActiveAdminPage();

  return (
    <AdminShell>
      <AdminOwnerClient />
    </AdminShell>
  );
}
