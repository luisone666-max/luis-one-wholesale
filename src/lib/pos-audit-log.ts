import "server-only";

import type { ActiveAdminUser } from "@/lib/admin-auth";
import type { createSupabaseAdminClient } from "@/lib/supabase/server";

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

type PosAuditInput = {
  supabase: SupabaseAdmin;
  saleId: string;
  action: string;
  admin: ActiveAdminUser;
  previousStatus?: string | null;
  newStatus?: string | null;
  reason?: string | null;
  snapshot?: Record<string, unknown> | null;
};

export async function writePosSaleAuditLog({
  supabase,
  saleId,
  action,
  admin,
  previousStatus,
  newStatus,
  reason,
  snapshot,
}: PosAuditInput) {
  const { error } = await supabase.from("pos_sale_audit_logs").insert({
    sale_id: saleId,
    action,
    previous_status: previousStatus ?? null,
    new_status: newStatus ?? null,
    reason: reason?.trim() || null,
    snapshot: snapshot ?? null,
    created_by_admin_user_id: admin.id,
    created_by_name_snapshot: admin.name || admin.email || admin.role,
  });

  if (error) {
    console.error("POS audit log write failed:", error.message);
  }
}
