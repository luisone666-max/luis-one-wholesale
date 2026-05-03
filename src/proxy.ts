import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_ACCESS_TOKEN_COOKIE } from "@/lib/admin-auth-constants";

type AdminCheckResult = {
  allowed: boolean;
  message?: string;
};

function jsonDenied(message = "You do not have admin access.") {
  return NextResponse.json({ ok: false, message }, { status: 403 });
}

async function checkAdminAccess(token: string): Promise<AdminCheckResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Server-side proxy only. Never move this service role check into a client component.
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return { allowed: false, message: "Supabase admin auth is not configured." };
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
    },
  });

  if (!userResponse.ok) {
    return { allowed: false, message: "Admin login is required." };
  }

  const user = (await userResponse.json()) as { id?: string };

  if (!user.id) {
    return { allowed: false, message: "Admin login is required." };
  }

  const adminResponse = await fetch(
    `${supabaseUrl}/rest/v1/admin_users?auth_user_id=eq.${encodeURIComponent(user.id)}&active=eq.true&select=id`,
    {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );

  if (!adminResponse.ok) {
    return { allowed: false, message: "Admin access check failed." };
  }

  const admins = (await adminResponse.json()) as Array<{ id: string }>;
  return admins.length ? { allowed: true } : { allowed: false, message: "You do not have admin access." };
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAdminPage = path === "/admin" || path.startsWith("/admin/");
  const isAdminApi = path.startsWith("/api/admin/");

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

  const result = await checkAdminAccess(token);

  if (!result.allowed) {
    const response = isAdminApi ? jsonDenied(result.message) : NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.delete(ADMIN_ACCESS_TOKEN_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
