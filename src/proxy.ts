import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_ACCESS_TOKEN_COOKIE } from "@/lib/admin-auth-constants";

type AdminCheckResult = {
  allowed: boolean;
  message?: string;
  role?: AdminRole;
};

type AdminRole = "owner" | "admin" | "staff" | "sales" | "cashier" | "warehouse";

function jsonDenied(message = "You do not have admin access.") {
  return NextResponse.json({ ok: false, message }, { status: 403 });
}

function hasRole(role: AdminRole, allowed: AdminRole[]) {
  return allowed.includes(role);
}

function defaultAdminPathForRole(role: AdminRole) {
  if (role === "sales") {
    return "/admin/sales-desk";
  }

  if (role === "cashier") {
    return "/admin/cashier";
  }

  if (role === "warehouse") {
    return "/admin/orders";
  }

  if (role === "staff") {
    return "/admin/sales-desk";
  }

  return "/admin";
}

function canAccessAdminPage(path: string, role: AdminRole) {
  if (path === "/admin") {
    return hasRole(role, ["owner", "admin"]);
  }

  if (path.startsWith("/admin/products/bulk-upload")) {
    return hasRole(role, ["owner", "admin"]);
  }

  if (path.startsWith("/admin/products")) {
    return hasRole(role, ["owner", "admin", "warehouse", "sales", "staff"]);
  }

  if (path.startsWith("/admin/categories") || path.startsWith("/admin/wholesale-prices")) {
    return hasRole(role, ["owner", "admin"]);
  }

  if (path.startsWith("/admin/orders")) {
    return hasRole(role, ["owner", "admin", "warehouse"]);
  }

  if (path.startsWith("/admin/customers")) {
    return hasRole(role, ["owner", "admin"]);
  }

  if (path.startsWith("/admin/payments")) {
    return hasRole(role, ["owner", "admin"]);
  }

  if (path.startsWith("/admin/sales-desk")) {
    return hasRole(role, ["owner", "admin", "sales", "staff"]);
  }

  if (path.startsWith("/admin/cashier") || path.startsWith("/admin/cash-drawer")) {
    return hasRole(role, ["owner", "admin", "cashier"]);
  }

  if (path.startsWith("/admin/staff") || path.startsWith("/admin/reports") || path.startsWith("/admin/owner") || path.startsWith("/admin/settings")) {
    return hasRole(role, ["owner", "admin"]);
  }

  return hasRole(role, ["owner", "admin"]);
}

async function checkAdminAccess(request: NextRequest): Promise<AdminCheckResult> {
  const response = await fetch(new URL("/api/admin/auth/me", request.url), {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    return { allowed: false, message: result.message ?? "Admin login is required." };
  }

  const result = (await response.json().catch(() => ({}))) as { admin?: { role?: AdminRole } };
  return { allowed: true, role: result.admin?.role ?? "admin" };
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isDevDiagnostic = path === "/dev/supabase-test";
  const isAdminPage = path === "/admin" || path.startsWith("/admin/");
  const isAdminApi = path.startsWith("/api/admin/");

  if (isDevDiagnostic && process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (path === "/admin/login" || path.startsWith("/api/admin/auth/")) {
    return NextResponse.next();
  }

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value ?? "";

  if (!token) {
    if (isAdminApi) {
      return jsonDenied("Admin login is required.");
    }

    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const result = await checkAdminAccess(request);

  if (!result.allowed) {
    const response = isAdminApi ? jsonDenied(result.message) : NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.delete(ADMIN_ACCESS_TOKEN_COOKIE);
    return response;
  }

  if (isAdminPage && result.role && !canAccessAdminPage(path, result.role)) {
    return NextResponse.redirect(new URL(defaultAdminPathForRole(result.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/dev/supabase-test"],
};
