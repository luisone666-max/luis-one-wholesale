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

function adminLoginSuccessPage(request: Request, accessToken: string, maxAge: number) {
  const adminUrl = new URL("/admin", request.url).toString();
  const cookieValue = encodeURIComponent(accessToken);
  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="1;url=${adminUrl}" />
    <title>Opening Admin Dashboard</title>
    <script>
      window.setTimeout(function () {
        document.cookie = "wholesale_admin_access_token=${cookieValue}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure";
        window.location.replace("${adminUrl}");
      }, 250);
    </script>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; background: #f5f5f5; color: #18181b; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      section { width: 100%; max-width: 420px; border: 1px solid #e4e4e7; border-radius: 10px; background: white; padding: 28px; box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08); }
      h1 { margin: 0 0 10px; font-size: 24px; }
      p { margin: 0 0 18px; line-height: 1.5; color: #52525b; font-weight: 700; }
      a { display: flex; height: 46px; align-items: center; justify-content: center; border-radius: 8px; background: #f65f18; color: white; text-decoration: none; font-weight: 900; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>Login successful</h1>
        <p>Opening admin dashboard. If it does not open automatically, tap the button below.</p>
        <a href="${adminUrl}" onclick='document.cookie = "wholesale_admin_access_token=${cookieValue}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure";'>Open Admin Dashboard</a>
      </section>
    </main>
  </body>
</html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
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
    ? adminLoginSuccessPage(request, data.session.access_token, data.session.expires_in)
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
