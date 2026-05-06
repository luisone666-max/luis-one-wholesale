import { AdminPaymentsClient } from "@/components/admin/AdminPaymentsClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminPayments } from "@/lib/admin-payments-data";

export default async function AdminPaymentsPage() {
  const result = await getAdminPayments();

  return (
    <AdminShell>
      <AdminPaymentsClient initialPayments={result.payments} initialError={result.error} />
    </AdminShell>
  );
}

