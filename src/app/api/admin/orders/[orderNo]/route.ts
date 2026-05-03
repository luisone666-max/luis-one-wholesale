import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const orderStatuses = new Set([
  "pending_confirmation",
  "waiting_deposit",
  "deposit_paid",
  "sourcing_items",
  "ready_for_pickup",
  "completed",
  "cancelled",
  "unavailable_refund",
]);
const paymentStatuses = new Set(["no_payment", "deposit_submitted", "deposit_verified", "fully_paid", "rejected"]);
const shippingFeePayments = new Set(["freight_collect", "prepaid", "to_be_confirmed", "no_shipping_fee"]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function getShippingFeeStatus(paymentMethod: string) {
  if (paymentMethod === "freight_collect") {
    return "freight_collect";
  }

  if (paymentMethod === "no_shipping_fee") {
    return "no_shipping_fee";
  }

  return "to_be_confirmed";
}

function normalizeOrderStatus(value: string | null) {
  if (value === "waiting_for_deposit") {
    return "waiting_deposit";
  }

  return value ?? "pending_confirmation";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ orderNo: string }> }) {
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
  const update: Record<string, unknown> = {};

  if (typeof payload.orderStatus === "string") {
    if (!orderStatuses.has(payload.orderStatus)) {
      return jsonError("Invalid order status.");
    }

    update.order_status = payload.orderStatus;
  }

  if (typeof payload.paymentStatus === "string") {
    if (!paymentStatuses.has(payload.paymentStatus)) {
      return jsonError("Invalid payment status.");
    }

    update.payment_status = payload.paymentStatus;
  }

  if (typeof payload.shippingFeePayment === "string") {
    if (!shippingFeePayments.has(payload.shippingFeePayment)) {
      return jsonError("Invalid shipping fee payment method.");
    }

    update.shipping_fee_payment_method = payload.shippingFeePayment;
    update.shipping_fee_status = getShippingFeeStatus(payload.shippingFeePayment);

    if (payload.shippingFeePayment === "freight_collect" || payload.shippingFeePayment === "no_shipping_fee") {
      update.shipping_fee_amount = null;
    }
  }

  if ("shippingFeeAmount" in payload) {
    const amount = payload.shippingFeeAmount === null || payload.shippingFeeAmount === "" ? null : Number(payload.shippingFeeAmount);

    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      return jsonError("Shipping fee amount must be 0 or higher.");
    }

    update.shipping_fee_amount = amount;
  }

  if (typeof payload.adminNotes === "string") {
    update.admin_notes = payload.adminNotes;
  }

  if (!Object.keys(update).length) {
    return jsonError("No valid update fields were provided.");
  }

  const { data, error } = await admin
    .from("orders")
    .update(update)
    .eq("order_no", orderNo)
    .select("order_no,product_total,order_status,payment_status,shipping_fee_payment_method,shipping_fee_amount,shipping_fee_status,admin_notes")
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? "Order update failed.", 500);
  }

  const row = data as {
    order_no: string;
    product_total: number | string | null;
    order_status: string | null;
    payment_status: string | null;
    shipping_fee_payment_method: string | null;
    shipping_fee_amount: number | string | null;
    shipping_fee_status: string | null;
    admin_notes: string | null;
  };

  return NextResponse.json({
    ok: true,
    order: {
      orderNo: row.order_no,
      productTotal: Number(row.product_total ?? 0),
      amountToConfirm: Number(row.product_total ?? 0),
      orderStatus: normalizeOrderStatus(row.order_status),
      paymentStatus: row.payment_status ?? "no_payment",
      shippingFeePayment: row.shipping_fee_payment_method ?? "to_be_confirmed",
      shippingFeeAmount: row.shipping_fee_amount === null ? null : Number(row.shipping_fee_amount),
      shippingFeeStatus: row.shipping_fee_status ?? "to_be_confirmed",
      adminNotes: row.admin_notes ?? "",
    },
  });
}
