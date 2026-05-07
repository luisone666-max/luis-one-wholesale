import { AdminCustomersClient } from "@/components/admin/AdminCustomersClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { getAdminCustomers } from "@/lib/admin-customers-data";
import { canViewCustomerRecords } from "@/lib/admin-role-access";
import { redirect } from "next/navigation";

export default async function AdminCustomersPage() {
  const admin = await requireActiveAdminPage();

  if (!canViewCustomerRecords(admin.role)) {
    redirect("/admin");
  }

  const result = await getAdminCustomers();

  return (
    <AdminShell initialAdmin={admin}>
      <AdminCustomersClient initialCustomers={result.customers} initialError={result.error} pointsReady={result.pointsReady} />
    </AdminShell>
  );
}
