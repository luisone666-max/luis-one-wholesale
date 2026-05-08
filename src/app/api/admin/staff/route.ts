import { NextResponse } from "next/server";
import { canManageStaff } from "@/lib/admin-role-access";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { getAdminStaffUsers } from "@/lib/admin-users-data";
import { verifyOwnerActionPassword } from "@/lib/owner-action-password";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const roles = new Set(["owner", "admin", "staff", "sales", "cashier", "warehouse"]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function friendlyAuthError(message?: string) {
  const text = message ?? "Unable to create staff login.";

  if (text.toLowerCase().includes("already")) {
    return "This email is already registered.";
  }

  if (text.toLowerCase().includes("password")) {
    return "Password is too weak. Please use at least 8 characters.";
  }

  return text;
}

export async function GET(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (!canManageStaff(guard.admin.role)) {
    return jsonError("Only owner or admin can manage staff access.", 403);
  }

  const result = await getAdminStaffUsers();

  if (result.error) {
    return jsonError(result.error, 500);
  }

  return NextResponse.json({ ok: true, users: result.users });
}

export async function POST(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (!canManageStaff(guard.admin.role)) {
    return jsonError("Only owner or admin can create staff accounts.", 403);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const passwordCheck = await verifyOwnerActionPassword(payload.ownerPassword, guard.admin.id);

  if (!passwordCheck.ok) {
    return jsonError(passwordCheck.message, passwordCheck.message.includes("configured") ? 500 : 403);
  }

  const email = cleanText(payload.email).toLowerCase();
  const password = typeof payload.password === "string" ? payload.password : "";
  const name = cleanText(payload.name);
  const employeeNo = cleanText(payload.employeeNo);
  const notes = cleanText(payload.notes);
  const role = cleanText(payload.role) || "staff";

  if (!email || !password || !name) {
    return jsonError("Name, email, and password are required.");
  }

  if (!roles.has(role)) {
    return jsonError("Invalid staff role.");
  }

  if (guard.admin.role !== "owner" && role === "owner") {
    return jsonError("Only owner can create another owner account.", 403);
  }

  const { data: existingAdmin } = await admin.from("admin_users").select("id").eq("email", email).maybeSingle();

  if (existingAdmin) {
    return jsonError("This email is already an admin user.", 409);
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (authError || !authData.user) {
    return jsonError(friendlyAuthError(authError?.message), 400);
  }

  const { data: staff, error: insertError } = await admin
    .from("admin_users")
    .insert({
      auth_user_id: authData.user.id,
      email,
      name,
      role,
      active: true,
      employee_no: employeeNo || null,
      notes: notes || null,
    })
    .select("id,auth_user_id,email,name,role,active,employee_no,notes,created_at")
    .single();

  if (insertError || !staff) {
    await admin.auth.admin.deleteUser(authData.user.id).catch(() => undefined);
    return jsonError(insertError?.message ?? "Staff profile insert failed.", 500);
  }

  return NextResponse.json({ ok: true, user: staff });
}
