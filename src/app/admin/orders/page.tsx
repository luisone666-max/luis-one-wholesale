import { AdminShell } from "@/components/admin/AdminShell";
import { AdminOrdersClient } from "@/components/admin/AdminOrdersClient";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { getAdminOrders } from "@/lib/admin-orders-data";
import { redirect } from "next/navigation";

export default async function AdminOrdersPage() {
  const admin = await requireActiveAdminPage();

  if (admin.role !== "owner" && admin.role !== "admin" && admin.role !== "warehouse") {
    redirect("/admin");
  }

  const result = await getAdminOrders();

  return (
    <AdminShell initialAdmin={admin}>
      <AdminOrdersClient initialOrders={result.orders} initialStaffUsers={result.staffUsers} initialError={result.error} />
    </AdminShell>
  );
}
