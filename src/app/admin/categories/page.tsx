import { AdminShell } from "@/components/admin/AdminShell";
import { AdminCategoriesClient } from "@/components/admin/AdminCategoriesClient";
import { getAdminCategories } from "@/lib/admin-categories-data";

export default async function AdminCategoriesPage() {
  const result = await getAdminCategories();

  return (
    <AdminShell>
      <AdminCategoriesClient initialCategories={result.categories} initialError={result.error} />
    </AdminShell>
  );
}
