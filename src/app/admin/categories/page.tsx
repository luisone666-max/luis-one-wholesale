import { AdminShell } from "@/components/admin/AdminShell";
import { AdminCategoriesClient } from "@/components/admin/AdminCategoriesClient";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { getAdminCategories } from "@/lib/admin-categories-data";
import { redirect } from "next/navigation";

export default async function AdminCategoriesPage() {
  const admin = await requireActiveAdminPage();

  if (admin.role !== "owner" && admin.role !== "admin") {
    redirect("/admin");
  }

  const result = await getAdminCategories();

  return (
    <AdminShell initialAdmin={admin}>
      <AdminCategoriesClient initialCategories={result.categories} initialError={result.error} />
    </AdminShell>
  );
}
