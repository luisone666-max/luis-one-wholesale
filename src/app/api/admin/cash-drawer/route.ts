import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { canUseCashierCenter } from "@/lib/admin-role-access";
import { getCashDrawerData } from "@/lib/cash-drawer-data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function normalizeDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function money(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : null;
}

export async function GET(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (!canUseCashierCenter(guard.admin.role)) {
    return jsonError("Only cashier, admin, or owner can access Cash Drawer.", 403);
  }

  const url = new URL(request.url);
  const data = await getCashDrawerData(url.searchParams.get("date"));

  if (data.error) {
    return jsonError(data.error, 500);
  }

  return NextResponse.json({ ok: true, ...data });
}

export async function POST(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (!canUseCashierCenter(guard.admin.role)) {
    return jsonError("Only cashier, admin, or owner can update Cash Drawer.", 403);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(payload.action ?? "");

  if (action === "open") {
    const businessDate = normalizeDate(payload.businessDate);
    const openingCash = money(payload.openingCash);

    if (!businessDate) {
      return jsonError("Business date is required.");
    }

    if (openingCash === null) {
      return jsonError("Opening cash must be a valid amount.");
    }

    const { error } = await admin.from("cash_drawer_sessions").insert({
      business_date: businessDate,
      cashier_admin_user_id: guard.admin.id,
      cashier_name_snapshot: guard.admin.name,
      opening_cash: openingCash,
      status: "open",
      opening_notes: String(payload.notes ?? "").trim() || null,
    });

    if (error) {
      return jsonError(error.code === "23505" ? "Cash drawer already exists for this date." : error.message, 409);
    }

    return NextResponse.json({ ok: true, ...(await getCashDrawerData(businessDate)) });
  }

  if (action === "add_entry") {
    const sessionId = String(payload.sessionId ?? "");
    const amount = money(payload.amount);
    const entryType = String(payload.entryType ?? "");
    const reason = String(payload.reason ?? "").trim();

    if (!sessionId) {
      return jsonError("Cash drawer session is required.");
    }

    if (entryType !== "cash_out" && entryType !== "cash_in_adjustment") {
      return jsonError("Entry type is invalid.");
    }

    if (amount === null || amount <= 0) {
      return jsonError("Amount must be greater than 0.");
    }

    if (!reason) {
      return jsonError("Reason is required.");
    }

    const { data: session, error: sessionError } = await admin
      .from("cash_drawer_sessions")
      .select("id,business_date,status")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      return jsonError(sessionError?.message ?? "Cash drawer session was not found.", 404);
    }

    if ((session as { status: string }).status === "closed") {
      return jsonError("Cash drawer is already closed.");
    }

    const { error } = await admin.from("cash_drawer_entries").insert({
      session_id: sessionId,
      entry_type: entryType,
      amount,
      reason,
      notes: String(payload.notes ?? "").trim() || null,
      created_by_admin_user_id: guard.admin.id,
      created_by_name_snapshot: guard.admin.name,
    });

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ ok: true, ...(await getCashDrawerData((session as { business_date: string }).business_date)) });
  }

  if (action === "close") {
    const sessionId = String(payload.sessionId ?? "");
    const actualCash = money(payload.actualCash);

    if (!sessionId) {
      return jsonError("Cash drawer session is required.");
    }

    if (actualCash === null) {
      return jsonError("Actual cash must be a valid amount.");
    }

    const { data: session, error: sessionError } = await admin
      .from("cash_drawer_sessions")
      .select("id,business_date,status")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      return jsonError(sessionError?.message ?? "Cash drawer session was not found.", 404);
    }

    const businessDate = (session as { business_date: string }).business_date;
    const drawerData = await getCashDrawerData(businessDate);
    const difference = Math.round((actualCash - drawerData.expectedCash) * 100) / 100;

    const { error } = await admin
      .from("cash_drawer_sessions")
      .update({
        expected_cash: drawerData.expectedCash,
        actual_cash: actualCash,
        difference_amount: difference,
        status: "closed",
        closing_notes: String(payload.notes ?? "").trim() || null,
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ ok: true, ...(await getCashDrawerData(businessDate)) });
  }

  return jsonError("Unsupported cash drawer action.");
}
