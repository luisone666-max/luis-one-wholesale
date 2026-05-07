import { AdminPaymentsClient } from "@/components/admin/AdminPaymentsClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { getAdminPayments } from "@/lib/admin-payments-data";
import { redirect } from "next/navigation";

export default async function AdminPaymentsPage() {
  const admin = await requireActiveAdminPage();

  if (admin.role !== "owner" && admin.role !== "admin") {
    redirect("/admin");
  }

  const result = await getAdminPayments();

  return (
    <AdminShell initialAdmin={admin}>
      <AdminPaymentsClient initialPayments={result.payments} initialError={result.error} />
    </AdminShell>
  );
}
