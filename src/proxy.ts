import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_ACCESS_TOKEN_COOKIE } from "@/lib/admin-auth-constants";

type AdminCheckResult = {
  allowed: boolean;
  message?: string;
};

function jsonDenied(message = "You do not have admin access.") {
  return NextResponse.json({ ok: false, message }, { status: 403 });
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

  return { allowed: true };
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/dev/supabase-test"],
};
