import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { ADMIN_ACCESS_TOKEN_COOKIE } from "@/lib/admin-auth-constants";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type ActiveAdminUser = {
  id: string;
  authUserId: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "staff";
};

type AdminUserRow = {
  id: string;
  auth_user_id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  active: boolean | null;
};

export function getAdminTokenFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return "";
  }

  const cookiesByName = new Map(
    cookieHeader.split(";").map((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");
      return [name, decodeURIComponent(valueParts.join("="))];
    }),
  );

  return cookiesByName.get(ADMIN_ACCESS_TOKEN_COOKIE) ?? "";
}

function mapAdminRow(row: AdminUserRow, fallbackEmail: string): ActiveAdminUser {
  const role = row.role === "owner" || row.role === "staff" ? row.role : "admin";

  return {
    id: row.id,
    authUserId: row.auth_user_id,
    email: row.email ?? fallbackEmail,
    name: row.name ?? row.email ?? fallbackEmail,
    role,
  };
}

export async function getActiveAdminByToken(token: string): Promise<{ admin: ActiveAdminUser | null; message?: string }> {
  if (!token) {
    return { admin: null, message: "Admin login is required." };
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { admin: null, message: "Supabase admin client is not configured." };
  }

  const { data: userResult, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userResult.user) {
    return { admin: null, message: "Admin login is required." };
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("id,auth_user_id,email,name,role,active")
    .eq("auth_user_id", userResult.user.id)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    return { admin: null, message: error.message };
  }

  if (!data) {
    return { admin: null, message: "You do not have admin access." };
  }

  return { admin: mapAdminRow(data as AdminUserRow, userResult.user.email ?? "") };
}

export async function getActiveAdminFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value ?? "";
  return getActiveAdminByToken(token);
}

export async function requireActiveAdminPage() {
  const { admin } = await getActiveAdminFromCookies();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

export async function requireActiveAdminRequest(request: Request) {
  return getActiveAdminByToken(getAdminTokenFromCookieHeader(request.headers.get("cookie")));
}

export async function requireActiveAdminApi(request: Request) {
  const result = await requireActiveAdminRequest(request);

  if (!result.admin) {
    return {
      admin: null,
      response: NextResponse.json({ ok: false, message: result.message ?? "You do not have admin access." }, { status: 403 }),
    };
  }

  return { admin: result.admin, response: null };
}
