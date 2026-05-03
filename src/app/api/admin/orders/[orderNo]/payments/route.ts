import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
}

export async function POST(request: Request, { params }: { params: Promise<{ orderNo: string }> }) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const { orderNo } = await params;
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const paymentMethod = typeof payload.paymentMethod === "string" ? payload.paymentMethod.trim() : "";
  const referenceNo = typeof payload.referenceNo === "string" ? payload.referenceNo.trim() : "";
  const proofImageUrl = typeof payload.proofImageUrl === "string" && payload.proofImageUrl.trim() ? payload.proofImageUrl.trim() : null;
  const status = typeof payload.status === "string" && payload.status.trim() ? payload.status.trim() : "pending";
  const amount = Number(payload.amount);

  if (!paymentMethod) {
    return jsonError("Payment Method is required.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return jsonError("Amount must be greater than 0.");
  }

  const { data: order, error: orderError } = await admin.from("orders").select("id").eq("order_no", orderNo).maybeSingle();

  if (orderError) {
    return jsonError(orderError.message, 500);
  }

  if (!order) {
    return jsonError("Order was not found.", 404);
  }

  const { data, error } = await admin
    .from("payment_records")
    .insert({
      order_id: (order as { id: string }).id,
      payment_method: paymentMethod,
      amount,
      reference_no: referenceNo || null,
      proof_image_url: proofImageUrl,
      status,
    })
    .select("id,payment_method,amount,reference_no,proof_image_url,status,created_at")
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? "Payment record creation failed.", 500);
  }

  const row = data as {
    id: string;
    payment_method: string | null;
    amount: number | string | null;
    reference_no: string | null;
    proof_image_url: string | null;
    status: string | null;
    created_at: string | null;
  };

  return NextResponse.json({
    ok: true,
    payment: {
      id: row.id,
      method: row.payment_method ?? "",
      amount: Number(row.amount ?? 0),
      referenceNo: row.reference_no ?? "",
      status: row.status ?? "pending",
      date: formatDate(row.created_at),
      proofImageUrl: row.proof_image_url,
    },
  });
}
