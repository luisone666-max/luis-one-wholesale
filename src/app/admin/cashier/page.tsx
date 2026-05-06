import { AdminAccessDeniedPanel } from "@/components/admin/AdminAccessDeniedPanel";
import { AdminCashierClient } from "@/components/admin/AdminCashierClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { canUseCashierCenter } from "@/lib/admin-role-access";
import { getPosSales } from "@/lib/pos-data";

export default async function AdminCashierPage() {
  const admin = await requireActiveAdminPage();

  if (!canUseCashierCenter(admin.role)) {
    return (
      <AdminShell>
        <AdminAccessDeniedPanel
          title="Cashier Center is for payment confirmation only"
          message="Only cashier, admin, or owner accounts can confirm POS payments and update cashier records. Sales staff should create sales slips in Sales Desk, then wait for cashier confirmation."
        />
      </AdminShell>
    );
  }

  const result = await getPosSales("waiting_cashier");

  return (
    <AdminShell>
      <AdminCashierClient initialSales={result.sales} initialError={result.error} />
    </AdminShell>
  );
}
