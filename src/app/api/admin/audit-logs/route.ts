import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function isMissingAuditTableError(error: { message?: string; code?: string } | null) {
  const message = (error?.message ?? "").toLowerCase();
  return message.includes("admin_action_audit_logs") && (message.includes("schema cache") || message.includes("could not find"));
}

export async function GET(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (guard.admin.role !== "owner" && guard.admin.role !== "admin") {
    return jsonError("Only owner or admin can view audit logs.", 403);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const { data, error } = await admin
    .from("admin_action_audit_logs")
    .select("id,admin_email,admin_role,action,entity_type,entity_id,entity_label,created_at")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    if (isMissingAuditTableError(error)) {
      return NextResponse.json({
        ok: true,
        logs: [],
        message: "Admin audit log migration has not been run yet.",
      });
    }

    return jsonError(error.message, 500);
  }

  return NextResponse.json({ ok: true, logs: data ?? [] });
}
