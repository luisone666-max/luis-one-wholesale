import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { verifyOwnerActionPassword } from "@/lib/owner-action-password";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (guard.admin.role !== "owner" && guard.admin.role !== "admin") {
    return jsonError("Only owner or admin can access owner center.", 403);
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await verifyOwnerActionPassword(payload.ownerPassword, guard.admin.id);

  if (!result.ok) {
    return jsonError(result.message, result.message.includes("configured") ? 500 : 403);
  }

  return NextResponse.json({ ok: true });
}
