import type { ActiveAdminUser } from "@/lib/admin-auth";

export function canUseCashierCenter(role: ActiveAdminUser["role"]) {
  return role === "owner" || role === "admin" || role === "cashier";
}

export function canUseSalesDesk(role: ActiveAdminUser["role"]) {
  return role === "owner" || role === "admin" || role === "sales" || role === "staff";
}

export function canManageProducts(role: ActiveAdminUser["role"]) {
  return role === "owner" || role === "admin" || role === "warehouse";
}

export function canViewCustomerRecords(role: ActiveAdminUser["role"]) {
  return role === "owner" || role === "admin";
}

export function canViewReports(role: ActiveAdminUser["role"]) {
  return role === "owner" || role === "admin";
}

export function canManageStaff(role: ActiveAdminUser["role"]) {
  return role === "owner" || role === "admin";
}
