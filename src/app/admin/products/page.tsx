import { AdminShell } from "@/components/admin/AdminShell";
import { AdminProductsClient } from "@/components/admin/AdminProductsClient";
import { AdminProductPriceLookupClient } from "@/components/admin/AdminProductPriceLookupClient";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { getAdminProducts, toAdminProductLookupRecords } from "@/lib/admin-products-data";
import { canManageProducts } from "@/lib/admin-role-access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminProductsPage() {
  const admin = await requireActiveAdminPage();
  const result = await getAdminProducts();
  const priceLookupOnly = admin.role === "sales" || admin.role === "staff";

  if (!priceLookupOnly && !canManageProducts(admin.role)) {
    redirect("/admin");
  }

  return (
    <AdminShell>
      {priceLookupOnly ? (
        <AdminProductPriceLookupClient products={toAdminProductLookupRecords(result.products)} initialError={result.error} />
      ) : (
        <AdminProductsClient initialProducts={result.products} categories={result.categories} initialError={result.error} />
      )}
    </AdminShell>
  );
}
