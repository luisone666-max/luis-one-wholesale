import { NextResponse } from "next/server";
import { canManageStaff } from "@/lib/admin-role-access";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { verifyOwnerActionPassword } from "@/lib/owner-action-password";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const roles = new Set(["owner", "admin", "staff", "sales", "cashier", "warehouse"]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (!canManageStaff(guard.admin.role)) {
    return jsonError("Only owner or admin can manage staff access.", 403);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const { id } = await params;
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const passwordCheck = await verifyOwnerActionPassword(payload.ownerPassword, guard.admin.id);

  if (!passwordCheck.ok) {
    return jsonError(passwordCheck.message, passwordCheck.message.includes("configured") ? 500 : 403);
  }

  const update: Record<string, unknown> = {};

  if (typeof payload.name === "string") {
    update.name = cleanText(payload.name);
  }

  if (typeof payload.employeeNo === "string") {
    update.employee_no = cleanText(payload.employeeNo) || null;
  }

  if (typeof payload.notes === "string") {
    update.notes = cleanText(payload.notes) || null;
  }

  if (typeof payload.role === "string") {
    const role = cleanText(payload.role);

    if (!roles.has(role)) {
      return jsonError("Invalid staff role.");
    }

    if (guard.admin.role !== "owner" && role === "owner") {
      return jsonError("Only owner can assign owner role.", 403);
    }

    update.role = role;
  }

  if (typeof payload.active === "boolean") {
    update.active = payload.active;
  }

  if (!Object.keys(update).length) {
    return jsonError("No valid update fields were provided.");
  }

  update.updated_at = new Date().toISOString();

  const { data, error } = await admin
    .from("admin_users")
    .update(update)
    .eq("id", id)
    .select("id,auth_user_id,email,name,role,active,employee_no,notes,created_at")
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? "Staff update failed.", 500);
  }

  return NextResponse.json({ ok: true, user: data });
}
