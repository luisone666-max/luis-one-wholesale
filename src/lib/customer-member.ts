"use client";

import { getCurrentCustomerSession } from "@/lib/customer-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type CustomerMemberSummary = {
  name: string;
  phone: string;
  businessType: string;
  pointsBalance: number | null;
  lifetimePoints: number | null;
  pointsReady: boolean;
};

export type CustomerLoyaltyTransaction = {
  id: string;
  sourceType: string;
  sourceId: string;
  points: number;
  amount: number;
  note: string;
  createdAt: string;
};

function toNumber(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function hasMissingPointsColumnError(message: string) {
  return message.includes("points_balance") || message.includes("lifetime_points");
}

function hasMissingLoyaltyTableError(message: string) {
  return message.includes("customer_loyalty_point_transactions") || message.includes("schema cache");
}

export async function getCustomerMemberSummary(): Promise<{ member: CustomerMemberSummary | null; error?: string }> {
  const supabase = createBrowserSupabaseClient();

  if (!supabase) {
    return { member: null, error: "Supabase is not configured yet." };
  }

  const session = await getCurrentCustomerSession();

  if (!session.user || !session.customer) {
    return { member: null, error: "Please login or register to view your member card." };
  }

  const withPoints = await supabase
    .from("customers")
    .select("name,phone,business_type,points_balance,lifetime_points")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  if (!withPoints.error && withPoints.data) {
    const row = withPoints.data as {
      name: string;
      phone: string | null;
      business_type: string | null;
      points_balance: number | null;
      lifetime_points: number | null;
    };

    return {
      member: {
        name: row.name,
        phone: row.phone ?? "",
        businessType: row.business_type ?? "",
        pointsBalance: toNumber(row.points_balance),
        lifetimePoints: toNumber(row.lifetime_points),
        pointsReady: true,
      },
    };
  }

  if (withPoints.error && !hasMissingPointsColumnError(withPoints.error.message)) {
    return { member: null, error: withPoints.error.message };
  }

  const withoutPoints = await supabase
    .from("customers")
    .select("name,phone,business_type")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  if (withoutPoints.error) {
    return { member: null, error: withoutPoints.error.message };
  }

  if (!withoutPoints.data) {
    return { member: null, error: "Customer profile was not found." };
  }

  const row = withoutPoints.data as { name: string; phone: string | null; business_type: string | null };

  return {
    member: {
      name: row.name,
      phone: row.phone ?? "",
      businessType: row.business_type ?? "",
      pointsBalance: null,
      lifetimePoints: null,
      pointsReady: false,
    },
  };
}

export async function getCustomerLoyaltyTransactions(): Promise<{
  transactions: CustomerLoyaltyTransaction[];
  pointsReady: boolean;
  error?: string;
}> {
  const supabase = createBrowserSupabaseClient();

  if (!supabase) {
    return { transactions: [], pointsReady: false, error: "Supabase is not configured yet." };
  }

  const session = await getCurrentCustomerSession();

  if (!session.user || !session.customer) {
    return { transactions: [], pointsReady: false, error: "Please login or register to view points activity." };
  }

  const { data, error } = await supabase
    .from("customer_loyalty_point_transactions")
    .select("id,source_type,source_id,points,amount,note,created_at")
    .eq("customer_id", session.customer.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    if (hasMissingLoyaltyTableError(error.message)) {
      return { transactions: [], pointsReady: false };
    }

    return { transactions: [], pointsReady: false, error: error.message };
  }

  return {
    pointsReady: true,
    transactions: ((data ?? []) as Record<string, unknown>[]).map((row) => ({
      id: String(row.id ?? ""),
      sourceType: String(row.source_type ?? ""),
      sourceId: String(row.source_id ?? ""),
      points: toNumber(row.points),
      amount: toNumber(row.amount),
      note: String(row.note ?? ""),
      createdAt: String(row.created_at ?? ""),
    })),
  };
}
