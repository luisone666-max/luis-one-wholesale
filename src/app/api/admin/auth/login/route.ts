import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ADMIN_ACCESS_TOKEN_COOKIE } from "@/lib/admin-auth-constants";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function isFormRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
}

function redirectToLogin(request: Request, error: string) {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const config = getSupabasePublicConfig();
  const admin = createSupabaseAdminClient();
  const formRequest = isFormRequest(request);

  if (!config || !admin) {
    if (formRequest) {
      return redirectToLogin(request, "config");
    }

    return jsonError("Supabase admin auth is not configured.", 500);
  }

  let emailValue: unknown;
  let passwordValue: unknown;

  if (formRequest) {
    const formData = await request.formData();
    emailValue = formData.get("email");
    passwordValue = formData.get("password");
  } else {
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    emailValue = payload.email;
    passwordValue = payload.password;
  }
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !password) {
    if (formRequest) {
      return redirectToLogin(request, "required");
    }

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
    if (formRequest) {
      return redirectToLogin(request, "invalid");
    }

    return jsonError("Invalid email or password.", 401);
  }

  const { data: adminUser, error: adminError } = await admin
    .from("admin_users")
    .select("id,email,name,role,active")
    .eq("auth_user_id", data.user.id)
    .eq("active", true)
    .maybeSingle();

  if (adminError) {
    if (formRequest) {
      return redirectToLogin(request, "server");
    }

    return jsonError(adminError.message, 500);
  }

  if (!adminUser) {
    if (formRequest) {
      return redirectToLogin(request, "denied");
    }

    return jsonError("You do not have admin access.", 403);
  }

  const response = formRequest
    ? NextResponse.redirect(new URL("/admin", request.url), 303)
    : NextResponse.json({
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
