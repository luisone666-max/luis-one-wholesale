import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { canViewCustomerRecords } from "@/lib/admin-role-access";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type LoyaltyRow = {
  id: string;
  source_type: string | null;
  source_id: string | null;
  points: number | string | null;
  amount: number | string | null;
  note: string | null;
  created_at: string | null;
};

type CustomerPointsRow = {
  id: string;
  points_balance: number | string | null;
  lifetime_points: number | string | null;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function toNumber(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function hasMissingLoyaltyTableError(message: string) {
  return message.includes("customer_loyalty_point_transactions") || message.includes("schema cache");
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (!guard.admin || !canViewCustomerRecords(guard.admin.role)) {
    return jsonError("Only admin or owner can view customer points history.", 403);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const { id } = await context.params;
  const { data, error } = await admin
    .from("customer_loyalty_point_transactions")
    .select("id,source_type,source_id,points,amount,note,created_at")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    if (hasMissingLoyaltyTableError(error.message)) {
      return NextResponse.json({
        ok: true,
        pointsReady: false,
        transactions: [],
        message: "Run the loyalty points migration to view points history.",
      });
    }

    return jsonError(error.message, 500);
  }

  return NextResponse.json({
    ok: true,
    pointsReady: true,
    transactions: ((data ?? []) as LoyaltyRow[]).map((row) => ({
      id: row.id,
      sourceType: row.source_type ?? "",
      sourceId: row.source_id ?? "",
      points: toNumber(row.points),
      amount: toNumber(row.amount),
      note: row.note ?? "",
      createdAt: row.created_at ?? "",
    })),
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (!guard.admin || !canViewCustomerRecords(guard.admin.role)) {
    return jsonError("Only admin or owner can adjust customer points.", 403);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const payload = (await request.json().catch(() => null)) as { points?: unknown; note?: unknown } | null;
  const points = Math.trunc(Number(payload?.points ?? 0));
  const note = typeof payload?.note === "string" ? payload.note.trim() : "";

  if (!points) {
    return jsonError("Points adjustment must be a non-zero number.");
  }

  if (!note) {
    return jsonError("Adjustment note is required.");
  }

  const { id } = await context.params;
  const { data: customerData, error: customerError } = await admin
    .from("customers")
    .select("id,points_balance,lifetime_points")
    .eq("id", id)
    .maybeSingle();

  if (customerError) {
    if (hasMissingLoyaltyTableError(customerError.message) || customerError.message.includes("points_balance")) {
      return jsonError("Run the loyalty points migration before adjusting points.", 500);
    }

    return jsonError(customerError.message, 500);
  }

  const customer = customerData as CustomerPointsRow | null;

  if (!customer) {
    return jsonError("Customer was not found.", 404);
  }

  const currentBalance = toNumber(customer.points_balance);
  const currentLifetime = toNumber(customer.lifetime_points);
  const nextBalance = currentBalance + points;

  if (nextBalance < 0) {
    return jsonError("Customer points balance cannot be negative.");
  }

  const nextLifetime = points > 0 ? currentLifetime + points : currentLifetime;
  const transactionId = crypto.randomUUID();
  const { error: insertError } = await admin.from("customer_loyalty_point_transactions").insert({
    id: transactionId,
    customer_id: id,
    source_type: "manual_adjustment",
    source_id: transactionId,
    points,
    amount: 0,
    note,
    created_by_admin_user_id: guard.admin.id,
  });

  if (insertError) {
    if (hasMissingLoyaltyTableError(insertError.message)) {
      return jsonError("Run the loyalty points migration before adjusting points.", 500);
    }

    return jsonError(insertError.message, 500);
  }

  const { error: updateError } = await admin
    .from("customers")
    .update({
      points_balance: nextBalance,
      lifetime_points: nextLifetime,
    })
    .eq("id", id);

  if (updateError) {
    return jsonError(updateError.message, 500);
  }

  return NextResponse.json({
    ok: true,
    message: "Customer points adjusted.",
    pointsBalance: nextBalance,
    lifetimePoints: nextLifetime,
    transaction: {
      id: transactionId,
      sourceType: "manual_adjustment",
      sourceId: transactionId,
      points,
      amount: 0,
      note,
      createdAt: new Date().toISOString(),
    },
  });
}
