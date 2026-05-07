import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { getAdminDashboardData } from "@/lib/admin-dashboard-data";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const admin = await requireActiveAdminPage();

  if (admin.role === "sales" || admin.role === "staff") {
    redirect("/admin/sales-desk");
  }

  if (admin.role === "cashier") {
    redirect("/admin/cashier");
  }

  if (admin.role === "warehouse") {
    redirect("/admin/orders");
  }

  const data = await getAdminDashboardData();

  return (
    <AdminShell initialAdmin={admin}>
      <AdminDashboardClient data={data} />
    </AdminShell>
  );
}
