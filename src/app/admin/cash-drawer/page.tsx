import { AdminCashDrawerClient } from "@/components/admin/AdminCashDrawerClient";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { canUseCashierCenter } from "@/lib/admin-role-access";
import { getCashDrawerData } from "@/lib/cash-drawer-data";

export default async function AdminCashDrawerPage() {
  const admin = await requireActiveAdminPage();

  if (!canUseCashierCenter(admin.role)) {
    return (
      <AdminShell>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-800">
          Only cashier, admin, or owner can access Cash Drawer.
        </div>
      </AdminShell>
    );
  }

  const initialData = await getCashDrawerData();

  return (
    <AdminShell>
      <AdminCashDrawerClient initialData={initialData} />
    </AdminShell>
  );
}
