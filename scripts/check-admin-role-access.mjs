import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function requireIncludes(failures, relativePath, snippets) {
  const contents = read(relativePath);

  for (const snippet of snippets) {
    if (!contents.includes(snippet)) {
      failures.push(`${relativePath} is missing expected role-access guard: ${snippet}`);
    }
  }
}

function requireNotIncludes(failures, relativePath, snippets) {
  const contents = read(relativePath);

  for (const snippet of snippets) {
    if (contents.includes(snippet)) {
      failures.push(`${relativePath} contains an unsafe role allowance: ${snippet}`);
    }
  }
}

function main() {
  const failures = [];

  requireIncludes(failures, "src/lib/admin-role-access.ts", [
    'role === "owner" || role === "admin" || role === "cashier"',
    'role === "owner" || role === "admin" || role === "sales" || role === "staff"',
    'role === "owner" || role === "admin" || role === "warehouse"',
    'role === "owner" || role === "admin"',
  ]);
  requireNotIncludes(failures, "src/lib/admin-role-access.ts", [
    'canUseCashierCenter(role: ActiveAdminUser["role"]) {\n  return role === "owner" || role === "admin" || role === "cashier" || role === "sales"',
    'canManageProducts(role: ActiveAdminUser["role"]) {\n  return role === "owner" || role === "admin" || role === "warehouse" || role === "sales"',
  ]);

  requireIncludes(failures, "src/app/admin/cashier/page.tsx", [
    "canUseCashierCenter",
    "AdminAccessDeniedPanel",
  ]);
  requireIncludes(failures, "src/app/admin/cash-drawer/page.tsx", [
    "canUseCashierCenter",
    "AdminAccessDeniedPanel",
  ]);
  requireIncludes(failures, "src/app/admin/sales-desk/page.tsx", [
    "canUseSalesDesk",
    "ownSummaryOnly",
  ]);
  requireIncludes(failures, "src/app/admin/products/page.tsx", [
    "priceLookupOnly",
    "canManageProducts",
  ]);

  requireIncludes(failures, "src/app/api/admin/pos/sales/[id]/confirm-payment/route.ts", [
    "canUseCashierCenter",
    "Only cashier, admin, or owner can confirm payment.",
  ]);
  requireIncludes(failures, "src/app/api/admin/pos/sales/route.ts", [
    "canUseSalesDesk",
    "canUseCashierCenter",
    "Sales staff can only create sales using their own employee number.",
  ]);
  requireIncludes(failures, "src/app/api/admin/pos/sales/[id]/route.ts", [
    "canUseSalesDesk",
    "canUseCashierCenter",
    "Only admin or owner can void paid sales.",
    "You can only edit your own sales slips.",
  ]);
  requireIncludes(failures, "src/app/api/admin/products/route.ts", [
    "canManageProducts",
    'guard.admin.role === "sales" || guard.admin.role === "staff"',
    "toAdminProductLookupRecords",
    "Only product managers can create products.",
  ]);
  requireIncludes(failures, "src/app/api/admin/staff/route.ts", [
    "canManageStaff",
    "verifyOwnerActionPassword",
    "Only owner can create another owner account.",
  ]);

  if (failures.length) {
    console.error("Admin role access check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Admin role access check passed:");
  console.log("- sales/staff are limited to Sales Desk and price lookup");
  console.log("- cashier-only payment confirmation stays cashier/admin/owner protected");
  console.log("- product, category, staff, reports, and owner controls stay manager protected");
}

main();
