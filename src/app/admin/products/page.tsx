import { AdminShell } from "@/components/admin/AdminShell";
import { AdminProductsClient } from "@/components/admin/AdminProductsClient";
import { getAdminProducts } from "@/lib/admin-products-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminProductsPage() {
  const result = await getAdminProducts();

  return (
    <AdminShell>
      <AdminProductsClient initialProducts={result.products} categories={result.categories} initialError={result.error} />
    </AdminShell>
  );
}
