import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActiveAdminUser } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type AuditData = Record<string, unknown> | null;

type AdminAuditLogInput = {
  supabase?: SupabaseClient | null;
  admin: ActiveAdminUser;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  previousData?: AuditData;
  newData?: AuditData;
  metadata?: Record<string, unknown>;
};

function isMissingAuditTableError(error: { message?: string; code?: string }) {
  const message = (error.message ?? "").toLowerCase();
  return message.includes("admin_action_audit_logs") && (message.includes("schema cache") || message.includes("could not find"));
}

export async function writeAdminAuditLog({
  supabase,
  admin,
  action,
  entityType,
  entityId = null,
  entityLabel = null,
  previousData = null,
  newData = null,
  metadata = {},
}: AdminAuditLogInput) {
  const client = supabase ?? createSupabaseAdminClient();

  if (!client) {
    return;
  }

  const { error } = await client.from("admin_action_audit_logs").insert({
    admin_user_id: admin.id,
    admin_email: admin.email,
    admin_role: admin.role,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_label: entityLabel,
    previous_data: previousData,
    new_data: newData,
    metadata,
  });

  if (error && !isMissingAuditTableError(error)) {
    console.error("Admin audit log write failed:", error.message);
  }
}

export function summarizeProductAuditData(product: Record<string, unknown> | null | undefined) {
  if (!product) {
    return null;
  }

  return {
    sku: product.sku ?? null,
    name: product.name ?? null,
    slug: product.slug ?? null,
    active: product.active ?? null,
    stock_status: product.stock_status ?? null,
    moq: product.moq ?? null,
    retail_price: product.retail_price ?? null,
    category_id: product.category_id ?? null,
    subcategory_id: product.subcategory_id ?? null,
    child_category_id: product.child_category_id ?? null,
  };
}

export function summarizeProductPayload(payload: {
  sku: string;
  name: string;
  slug: string;
  active: boolean;
  stockStatus: string;
  moq: number;
  retailPrice: number | null;
  categoryId: string;
  subcategoryId: string | null;
  childCategoryId: string | null;
  tiers: unknown[];
  variants: unknown[];
}) {
  return {
    sku: payload.sku,
    name: payload.name,
    slug: payload.slug,
    active: payload.active,
    stock_status: payload.stockStatus,
    moq: payload.moq,
    retail_price: payload.retailPrice,
    category_id: payload.categoryId,
    subcategory_id: payload.subcategoryId,
    child_category_id: payload.childCategoryId,
    tier_count: payload.tiers.length,
    variant_count: payload.variants.length,
  };
}
