import { AdminCashDrawerClient } from "@/components/admin/AdminCashDrawerClient";
import { AdminAccessDeniedPanel } from "@/components/admin/AdminAccessDeniedPanel";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { canUseCashierCenter } from "@/lib/admin-role-access";
import { getCashDrawerData } from "@/lib/cash-drawer-data";

export default async function AdminCashDrawerPage() {
  const admin = await requireActiveAdminPage();

  if (!canUseCashierCenter(admin.role)) {
    return (
      <AdminShell initialAdmin={admin}>
        <AdminAccessDeniedPanel
          title="Cash Drawer is for cashier and owner control"
          message="Only cashier, admin, or owner accounts can review cash drawer totals. Sales staff should use Sales Desk to create slips and view their own sales summary."
        />
      </AdminShell>
    );
  }

  const initialData = await getCashDrawerData();

  return (
    <AdminShell initialAdmin={admin}>
      <AdminCashDrawerClient initialData={initialData} />
    </AdminShell>
  );
}
