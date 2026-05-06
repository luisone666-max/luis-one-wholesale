import { AdminReportsClient } from "@/components/admin/AdminReportsClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { canViewReports } from "@/lib/admin-role-access";
import { getEmployeeSalesReport } from "@/lib/employee-sales-report-data";
import { redirect } from "next/navigation";

export default async function AdminReportsPage() {
  const admin = await requireActiveAdminPage();

  if (!canViewReports(admin.role)) {
    redirect("/admin");
  }

  const result = await getEmployeeSalesReport();

  return (
    <AdminShell>
      <AdminReportsClient rows={result.rows} monthOptions={result.monthOptions} overview={result.overview} initialError={result.error} />
    </AdminShell>
  );
}
