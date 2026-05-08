import { AdminOperationsGuideClient } from "@/components/admin/AdminOperationsGuideClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireActiveAdminPage } from "@/lib/admin-auth";

export default async function AdminHelpPage() {
  const admin = await requireActiveAdminPage();

  return (
    <AdminShell initialAdmin={admin}>
      <AdminOperationsGuideClient />
    </AdminShell>
  );
}
