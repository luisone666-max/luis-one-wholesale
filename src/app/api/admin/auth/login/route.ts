import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ADMIN_ACCESS_TOKEN_COOKIE } from "@/lib/admin-auth-constants";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  const config = getSupabasePublicConfig();
  const admin = createSupabaseAdminClient();

  if (!config || !admin) {
    return jsonError("Supabase admin auth is not configured.", 500);
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!email || !password) {
    return jsonError("Email and password are required.");
  }

  const supabase = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session || !data.user) {
    return jsonError("Invalid email or password.", 401);
  }

  const { data: adminUser, error: adminError } = await admin
    .from("admin_users")
    .select("id,email,name,role,active")
    .eq("auth_user_id", data.user.id)
    .eq("active", true)
    .maybeSingle();

  if (adminError) {
    return jsonError(adminError.message, 500);
  }

  if (!adminUser) {
    return jsonError("You do not have admin access.", 403);
  }

  const response = NextResponse.json({
    ok: true,
    admin: {
      email: (adminUser as { email: string | null }).email ?? data.user.email ?? email,
      name: (adminUser as { name: string | null }).name ?? (adminUser as { email: string | null }).email ?? data.user.email ?? email,
      role: (adminUser as { role: string | null }).role ?? "admin",
    },
  });

  response.cookies.set(ADMIN_ACCESS_TOKEN_COOKIE, data.session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: data.session.expires_in,
  });

  return response;
}
