import { AdminCustomersClient } from "@/components/admin/AdminCustomersClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminCustomers } from "@/lib/admin-customers-data";

export default async function AdminCustomersPage() {
  const result = await getAdminCustomers();

  return (
    <AdminShell>
      <AdminCustomersClient initialCustomers={result.customers} initialError={result.error} pointsReady={result.pointsReady} />
    </AdminShell>
  );
}

