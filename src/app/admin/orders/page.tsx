import { AdminShell } from "@/components/admin/AdminShell";
import { AdminOrdersClient } from "@/components/admin/AdminOrdersClient";
import { getAdminOrders } from "@/lib/admin-orders-data";

export default async function AdminOrdersPage() {
  const result = await getAdminOrders();

  return (
    <AdminShell>
      <AdminOrdersClient initialOrders={result.orders} initialStaffUsers={result.staffUsers} initialError={result.error} />
    </AdminShell>
  );
}
