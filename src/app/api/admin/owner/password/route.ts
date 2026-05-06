import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { changeOwnerActionPassword } from "@/lib/owner-action-password";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function PATCH(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (guard.admin.role !== "owner" && guard.admin.role !== "admin") {
    return jsonError("Only owner or admin can change owner password.", 403);
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await changeOwnerActionPassword({
    currentPassword: payload.currentPassword,
    highestPermissionPassword: payload.highestPermissionPassword,
    newPassword: payload.newPassword,
    updatedByAdminUserId: guard.admin.id,
  });

  if (!result.ok) {
    return jsonError(result.message, result.message.includes("configured") ? 500 : 403);
  }

  return NextResponse.json({ ok: true, message: result.message });
}
