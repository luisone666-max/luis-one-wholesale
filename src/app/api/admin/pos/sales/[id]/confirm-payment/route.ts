import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { canUseCashierCenter } from "@/lib/admin-role-access";
import { awardCustomerLoyaltyPoints } from "@/lib/loyalty-points-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function money(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (!canUseCashierCenter(guard.admin.role)) {
    return jsonError("Only cashier, admin, or owner can confirm payment.", 403);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const { id } = await params;
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const amount = money(payload.amount);
  const referenceNo = cleanText(payload.referenceNo);
  const notes = cleanText(payload.notes);

  const { data: sale, error: saleError } = await admin
    .from("pos_sales")
    .select("id,sale_no,status,payment_method,total_amount,customer_id,customer_is_member")
    .eq("id", id)
    .maybeSingle();

  if (saleError || !sale) {
    return jsonError(saleError?.message ?? "Sale was not found.", 404);
  }

  if (sale.status !== "waiting_cashier") {
    return jsonError("This sale is already confirmed or cancelled.");
  }

  const paidAmount = amount ?? Number(sale.total_amount ?? 0);
  const expectedAmount = money(sale.total_amount) ?? 0;

  if (paidAmount <= 0) {
    return jsonError("Payment amount must be greater than 0.");
  }

  if (paidAmount !== expectedAmount) {
    return jsonError("Payment amount must match the sale amount before confirming.");
  }

  if ((sale.payment_method === "gcash" || sale.payment_method === "bank_transfer") && !referenceNo) {
    return jsonError("Reference number is required for GCash or bank transfer payments.");
  }

  const { error: paymentError } = await admin.from("pos_payment_confirmations").insert({
    sale_id: sale.id,
    cashier_admin_user_id: guard.admin.id,
    cashier_name_snapshot: guard.admin.name,
    payment_method: sale.payment_method,
    amount: paidAmount,
    reference_no: referenceNo || null,
    notes: notes || null,
  });

  if (paymentError) {
    return jsonError(paymentError.message, 500);
  }

  const now = new Date().toISOString();
  const { error: saleUpdateError } = await admin
    .from("pos_sales")
    .update({
      status: "paid",
      cashier_admin_user_id: guard.admin.id,
      cashier_name_snapshot: guard.admin.name,
      cashier_confirmed_at: now,
      updated_at: now,
    })
    .eq("id", sale.id);

  if (saleUpdateError) {
    return jsonError(saleUpdateError.message, 500);
  }

  const loyalty = await awardCustomerLoyaltyPoints({
    supabase: admin,
    customerId: sale.customer_is_member ? sale.customer_id : null,
    sourceType: "pos_sale",
    sourceId: sale.id,
    amount: paidAmount,
    createdByAdminUserId: guard.admin.id,
    note: `Offline sale ${sale.sale_no} payment confirmed.`,
  });

  return NextResponse.json({ ok: true, saleId: sale.id, status: "paid", loyalty });
}
