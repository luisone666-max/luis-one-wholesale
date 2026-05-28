import { AdminLogisticsClient } from "@/components/admin/AdminLogisticsClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { getAdminLogisticsReadiness } from "@/lib/admin-logistics-readiness";
import { redirect } from "next/navigation";

export default async function AdminLogisticsPage() {
  const admin = await requireActiveAdminPage();

  if (admin.role !== "owner" && admin.role !== "admin" && admin.role !== "warehouse") {
    redirect("/admin");
  }

  const readiness = await getAdminLogisticsReadiness();

  return (
    <AdminShell initialAdmin={admin}>
      <AdminLogisticsClient readiness={readiness} />
    </AdminShell>
  );
}
