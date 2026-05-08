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
  const priceLookupOnly = admin.role === "sales" || admin.role === "staff";
  const result = await getAdminProducts({ page: 1, pageSize: priceLookupOnly ? 200 : 24 });

  if (!priceLookupOnly && !canManageProducts(admin.role)) {
    redirect("/admin");
  }

  return (
    <AdminShell initialAdmin={admin}>
      {priceLookupOnly ? (
        <AdminProductPriceLookupClient products={toAdminProductLookupRecords(result.products)} initialError={result.error} />
      ) : (
        <AdminProductsClient
          initialProducts={result.products}
          categories={result.categories}
          initialError={result.error}
          initialTotalProducts={result.totalProducts}
          initialSummary={result.summary}
          initialCategoryProductCounts={result.categoryProductCounts}
        />
      )}
    </AdminShell>
  );
}
