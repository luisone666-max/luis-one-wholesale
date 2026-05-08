import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { awardCustomerLoyaltyPoints } from "@/lib/loyalty-points-server";
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

async function reverseOnlineOrderLoyaltyPoints({
  supabase,
  orderId,
  orderNo,
  customerId,
  amount,
  adminUserId,
  reason,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
  orderId: string;
  orderNo: string;
  customerId: string | null;
  amount: number;
  adminUserId: string;
  reason: string;
}) {
  if (!customerId) {
    return null;
  }

  const { data: pointsRow, error: pointsError } = await supabase
    .from("customer_loyalty_point_transactions")
    .select("points")
    .eq("source_type", "online_order")
    .eq("source_id", orderId)
    .maybeSingle();

  if (pointsError) {
    return { ok: false, awarded: false, points: 0, message: pointsError.message };
  }

  const points = Number(pointsRow?.points ?? 0);

  if (points <= 0) {
    return null;
  }

  const { data: adjustment, error: adjustmentError } = await supabase
    .from("customer_loyalty_point_transactions")
    .upsert(
      {
        customer_id: customerId,
        source_type: "manual_adjustment",
        source_id: orderId,
        points: -points,
        amount: -Math.abs(amount),
        note: `Reverse online order ${orderNo}: ${reason}`,
        created_by_admin_user_id: adminUserId,
      },
      { onConflict: "source_type,source_id", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();

  if (adjustmentError) {
    return { ok: false, awarded: false, points: 0, message: adjustmentError.message };
  }

  if (!adjustment) {
    return { ok: true, awarded: false, points: -points, message: "Loyalty reversal already exists." };
  }

  const { data: customer } = await supabase.from("customers").select("points_balance").eq("id", customerId).maybeSingle();
  const nextBalance = Math.max(0, Number(customer?.points_balance ?? 0) - points);
  const { error: customerError } = await supabase.from("customers").update({ points_balance: nextBalance }).eq("id", customerId);

  if (customerError) {
    return { ok: false, awarded: false, points: -points, message: customerError.message };
  }

  return { ok: true, awarded: false, points: -points, message: "Loyalty points reversed." };
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

  if ("salesAdminUserId" in payload) {
    const salesAdminUserId = typeof payload.salesAdminUserId === "string" ? payload.salesAdminUserId.trim() : "";

    if (!salesAdminUserId) {
      update.sales_admin_user_id = null;
      update.sales_name_snapshot = null;
      update.sales_assigned_at = null;
      update.sales_assigned_by_admin_user_id = null;
    } else {
      const { data: salesUser, error: salesUserError } = await admin
        .from("admin_users")
        .select("id,name,email,active")
        .eq("id", salesAdminUserId)
        .eq("active", true)
        .maybeSingle();

      if (salesUserError || !salesUser) {
        return jsonError(salesUserError?.message ?? "Salesperson was not found.", 404);
      }

      const user = salesUser as { id: string; name: string | null; email: string | null };
      update.sales_admin_user_id = user.id;
      update.sales_name_snapshot = user.name || user.email || "Admin User";
      update.sales_assigned_at = new Date().toISOString();
      update.sales_assigned_by_admin_user_id = guard.admin.id;
    }
  }

  if (!Object.keys(update).length) {
    return jsonError("No valid update fields were provided.");
  }

  const { data: existingOrder, error: existingOrderError } = await admin
    .from("orders")
    .select("id,order_no,customer_id,product_total,order_status,payment_status")
    .eq("order_no", orderNo)
    .maybeSingle();

  if (existingOrderError || !existingOrder) {
    return jsonError(existingOrderError?.message ?? "Order was not found.", 404);
  }

  const { data, error } = await admin
    .from("orders")
    .update(update)
    .eq("id", existingOrder.id)
    .select("id,order_no,customer_id,product_total,order_status,payment_status,shipping_fee_payment_method,shipping_fee_amount,shipping_fee_status,admin_notes,sales_admin_user_id,sales_name_snapshot")
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? "Order update failed.", 500);
  }

  const row = data as {
    id: string;
    order_no: string;
    customer_id: string | null;
    product_total: number | string | null;
    order_status: string | null;
    payment_status: string | null;
    shipping_fee_payment_method: string | null;
    shipping_fee_amount: number | string | null;
    shipping_fee_status: string | null;
    admin_notes: string | null;
    sales_admin_user_id: string | null;
    sales_name_snapshot: string | null;
  };
  let loyalty = null;

  if (update.payment_status === "fully_paid") {
    loyalty = await awardCustomerLoyaltyPoints({
      supabase: admin,
      customerId: row.customer_id,
      sourceType: "online_order",
      sourceId: row.id,
      amount: Number(row.product_total ?? 0),
      createdByAdminUserId: guard.admin.id,
      note: `Online order ${row.order_no} marked fully paid.`,
    });
  }

  const shouldReverseLoyalty =
    existingOrder.payment_status === "fully_paid" &&
    ((typeof update.payment_status === "string" && update.payment_status !== "fully_paid") ||
      update.order_status === "cancelled" ||
      update.order_status === "unavailable_refund");

  if (shouldReverseLoyalty) {
    loyalty = await reverseOnlineOrderLoyaltyPoints({
      supabase: admin,
      orderId: row.id,
      orderNo: row.order_no,
      customerId: row.customer_id,
      amount: Number(row.product_total ?? 0),
      adminUserId: guard.admin.id,
      reason: typeof update.order_status === "string" ? update.order_status : String(update.payment_status),
    });
  }

  return NextResponse.json({
    ok: true,
    loyalty,
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
      salesAdminUserId: row.sales_admin_user_id ?? "",
      salesName: row.sales_name_snapshot ?? "",
    },
  });
}
