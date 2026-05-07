import { AdminSalesDeskClient } from "@/components/admin/AdminSalesDeskClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { canUseSalesDesk } from "@/lib/admin-role-access";
import { getPosCatalogData, getPosSales, getPosSalesSummary } from "@/lib/pos-data";

export default async function AdminSalesDeskPage() {
  const admin = await requireActiveAdminPage();

  if (!canUseSalesDesk(admin.role)) {
    return (
      <AdminShell initialAdmin={admin}>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-800">
          Only sales, staff, admin, or owner can access Sales Desk.
        </div>
      </AdminShell>
    );
  }

  const data = await getPosCatalogData();
  const ownSummaryOnly = admin.role === "sales" || admin.role === "staff";
  const [summaryResult, recentSalesResult] = await Promise.all([
    getPosSalesSummary(ownSummaryOnly ? admin.id : undefined),
    getPosSales(undefined, { salespersonAdminUserId: ownSummaryOnly ? admin.id : undefined, limit: 12 }),
  ]);
  const defaultEmployeeNo = admin.employeeNo || data.staffUsers.find((user) => user.id === admin.id)?.employeeNo || data.staffUsers[0]?.employeeNo || "";

  return (
    <AdminShell initialAdmin={admin}>
      <AdminSalesDeskClient
        customers={data.customers}
        products={data.products}
        defaultEmployeeNo={defaultEmployeeNo}
        canChangeEmployeeNo={!ownSummaryOnly}
        summary={summaryResult.summary}
        summaryScope={ownSummaryOnly ? "mine" : "all"}
        recentSales={recentSalesResult.sales}
        initialError={data.error ?? summaryResult.error ?? recentSalesResult.error}
      />
    </AdminShell>
  );
}
