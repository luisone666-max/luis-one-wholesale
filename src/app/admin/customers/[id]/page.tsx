import { AdminCustomerDetailClient } from "@/components/admin/AdminCustomerDetailClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { getAdminCustomerDetail } from "@/lib/admin-customers-data";
import { canViewCustomerRecords } from "@/lib/admin-role-access";
import { redirect } from "next/navigation";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireActiveAdminPage();

  if (!canViewCustomerRecords(admin.role)) {
    redirect("/admin");
  }

  const { id } = await params;
  const result = await getAdminCustomerDetail(id);

  return (
    <AdminShell initialAdmin={admin}>
      <AdminCustomerDetailClient detail={result.detail} initialError={result.error} pointsReady={result.pointsReady} />
    </AdminShell>
  );
}
