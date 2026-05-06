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
        <AdminCashierClient initialSales={[]} initialError="Only cashier, admin, or owner can access Cashier Center." />
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
