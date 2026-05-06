import "server-only";

import type { createSupabaseAdminClient } from "@/lib/supabase/server";
import { calculateLoyaltyPoints } from "@/lib/loyalty-points";

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

type LoyaltyRpcRow = {
  awarded?: boolean;
  awarded_points?: number;
};

type LoyaltyAwardInput = {
  supabase: SupabaseAdmin;
  customerId: string | null | undefined;
  sourceType: "online_order" | "pos_sale";
  sourceId: string;
  amount: number;
  createdByAdminUserId?: string | null;
  note?: string;
};

export type LoyaltyAwardResult = {
  ok: boolean;
  points: number;
  awarded: boolean;
  message?: string;
};

export async function awardCustomerLoyaltyPoints({
  supabase,
  customerId,
  sourceType,
  sourceId,
  amount,
  createdByAdminUserId,
  note,
}: LoyaltyAwardInput): Promise<LoyaltyAwardResult> {
  if (!customerId) {
    return { ok: true, points: 0, awarded: false, message: "No member customer was selected." };
  }

  const points = calculateLoyaltyPoints(amount);

  if (points <= 0) {
    return { ok: true, points: 0, awarded: false, message: "Amount is below the points threshold." };
  }

  const rpcClient = supabase as unknown as {
    rpc: (
      functionName: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: LoyaltyRpcRow[] | LoyaltyRpcRow | null; error: { message: string } | null }>;
  };

  const { data, error } = await rpcClient.rpc("award_customer_loyalty_points", {
    p_customer_id: customerId,
    p_source_type: sourceType,
    p_source_id: sourceId,
    p_amount: amount,
    p_points: points,
    p_note: note ?? null,
    p_created_by_admin_user_id: createdByAdminUserId ?? null,
  });

  if (error) {
    return {
      ok: false,
      points,
      awarded: false,
      message: error.message,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const awarded = Boolean(row?.awarded);
  const awardedPoints = Number(row?.awarded_points ?? points);

  return {
    ok: true,
    points: awardedPoints,
    awarded,
    message: awarded ? "Member points awarded." : "Member points were already awarded for this sale.",
  };
}
