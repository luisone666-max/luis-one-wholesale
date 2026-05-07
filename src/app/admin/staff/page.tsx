import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStaffClient } from "@/components/admin/AdminStaffClient";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { canManageStaff } from "@/lib/admin-role-access";
import { getAdminStaffUsers } from "@/lib/admin-users-data";

export default async function AdminStaffPage() {
  const admin = await requireActiveAdminPage();
  const result = canManageStaff(admin.role) ? await getAdminStaffUsers() : { users: [], error: "Only owner or admin can manage staff access." };

  return (
    <AdminShell initialAdmin={admin}>
      <AdminStaffClient initialUsers={result.users} initialError={result.error} />
    </AdminShell>
  );
}
