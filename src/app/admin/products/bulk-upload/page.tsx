import { AdminProductBulkUploadClient } from "@/components/admin/AdminProductBulkUploadClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export default async function AdminProductBulkUploadPage() {
  const admin = await requireActiveAdminPage();

  if (admin.role !== "owner" && admin.role !== "admin") {
    redirect("/admin");
  }

  return (
    <AdminShell initialAdmin={admin}>
      <AdminProductBulkUploadClient />
    </AdminShell>
  );
}
