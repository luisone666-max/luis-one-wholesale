import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { canUseCashierCenter, canUseSalesDesk } from "@/lib/admin-role-access";
import { writePosSaleAuditLog } from "@/lib/pos-audit-log";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const paymentMethods = new Set(["cash", "gcash", "bank_transfer", "other"]);
const editableStatuses = new Set(["waiting_cashier", "returned_to_sales"]);

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

function qty(value: unknown) {
  const amount = Math.floor(Number(value));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function canChangeOwnSale(role: string, saleSalespersonId: string | null, adminId: string) {
  if (role === "owner" || role === "admin") {
    return true;
  }

  return (role === "sales" || role === "staff") && saleSalespersonId === adminId;
}

function isOwnerOrAdmin(role: string) {
  return role === "owner" || role === "admin";
}

function parseSalePayload(payload: Record<string, unknown>) {
  const employeeNo = cleanText(payload.employeeNo);
  const customerName = cleanText(payload.customerName);
  const customerPhone = cleanText(payload.customerPhone);
  const paymentMethod = cleanText(payload.paymentMethod) || "cash";
  const priceChangeNotes = cleanText(payload.priceChangeNotes);
  const saleNotes = cleanText(payload.saleNotes);
  const discountAmount = money(payload.discountAmount) ?? 0;
  const customerId = cleanText(payload.customerId);
  const customerIsMember = Boolean(payload.customerIsMember || customerId);
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const items = rawItems
    .map((item) => {
      const row = item as Record<string, unknown>;
      const quantity = qty(row.quantity);
      const unitPrice = money(row.unitPrice);
      const name = cleanText(row.name);

      if (!quantity || unitPrice === null || !name) {
        return null;
      }

      return {
        product_id: cleanText(row.productId) || null,
        variant_id: cleanText(row.variantId) || null,
        item_name_snapshot: name,
        sku_snapshot: cleanText(row.sku) || null,
        quantity,
        unit_price: unitPrice,
        subtotal: Math.round(quantity * unitPrice * 100) / 100,
        notes: cleanText(row.notes) || null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const productTotal = Math.round(items.reduce((total, item) => total + item.subtotal, 0) * 100) / 100;

  return {
    employeeNo,
    customerName,
    customerPhone,
    paymentMethod,
    priceChangeNotes,
    saleNotes,
    discountAmount,
    customerId,
    customerIsMember,
    items,
    productTotal,
    totalAmount: Math.max(0, Math.round((productTotal - discountAmount) * 100) / 100),
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (!canUseSalesDesk(guard.admin.role)) {
    return jsonError("Only sales, staff, admin, or owner can edit offline sales.", 403);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const { id } = await params;
  const { data: sale, error: saleError } = await admin
    .from("pos_sales")
    .select("id,sale_no,status,salesperson_admin_user_id")
    .eq("id", id)
    .maybeSingle();

  if (saleError || !sale) {
    return jsonError(saleError?.message ?? "Sale was not found.", 404);
  }

  if (!editableStatuses.has(String(sale.status))) {
    return jsonError("Only waiting or returned sales can be edited.");
  }

  if (!canChangeOwnSale(guard.admin.role, sale.salesperson_admin_user_id, guard.admin.id)) {
    return jsonError("You can only edit your own sales slips.", 403);
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseSalePayload(payload);

  if (!parsed.employeeNo) {
    return jsonError("Sales employee number is required.");
  }

  if ((guard.admin.role === "sales" || guard.admin.role === "staff") && guard.admin.employeeNo !== parsed.employeeNo) {
    return jsonError("Sales staff can only use their own employee number.", 403);
  }

  if (!parsed.customerName) {
    return jsonError("Customer name is required.");
  }

  if (!paymentMethods.has(parsed.paymentMethod)) {
    return jsonError("Payment method is invalid.");
  }

  if (!parsed.items.length) {
    return jsonError("At least one sale item is required.");
  }

  if (parsed.discountAmount > parsed.productTotal) {
    return jsonError("Discount cannot be greater than product total.");
  }

  const { data: salesperson, error: salespersonError } = await admin
    .from("admin_users")
    .select("id,name,email,employee_no,active")
    .eq("employee_no", parsed.employeeNo)
    .eq("active", true)
    .maybeSingle();

  if (salespersonError || !salesperson) {
    return jsonError(salespersonError?.message ?? "Sales employee number was not found.", 404);
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("pos_sales")
    .update({
      salesperson_admin_user_id: salesperson.id,
      salesperson_employee_no: parsed.employeeNo,
      salesperson_name_snapshot: salesperson.name || salesperson.email || parsed.employeeNo,
      customer_id: parsed.customerId || null,
      customer_name_snapshot: parsed.customerName,
      customer_phone_snapshot: parsed.customerPhone || null,
      customer_is_member: parsed.customerIsMember,
      payment_method: parsed.paymentMethod,
      product_total: parsed.productTotal,
      discount_amount: parsed.discountAmount,
      total_amount: parsed.totalAmount,
      status: "waiting_cashier",
      price_change_notes: parsed.priceChangeNotes || null,
      sale_notes: parsed.saleNotes || null,
      updated_at: now,
    })
    .eq("id", id);

  if (updateError) {
    return jsonError(updateError.message, 500);
  }

  const { error: deleteItemsError } = await admin.from("pos_sale_items").delete().eq("sale_id", id);

  if (deleteItemsError) {
    return jsonError(deleteItemsError.message, 500);
  }

  const { error: insertItemsError } = await admin.from("pos_sale_items").insert(parsed.items.map((item) => ({ ...item, sale_id: id })));

  if (insertItemsError) {
    return jsonError(insertItemsError.message, 500);
  }

  await writePosSaleAuditLog({
    supabase: admin,
    saleId: id,
    action: "updated",
    admin: guard.admin,
    previousStatus: sale.status,
    newStatus: "waiting_cashier",
    reason: cleanText(payload.reason) || "Sales slip updated before cashier confirmation.",
    snapshot: { saleNo: sale.sale_no, productTotal: parsed.productTotal, totalAmount: parsed.totalAmount },
  });

  return NextResponse.json({ ok: true, saleId: id, saleNo: sale.sale_no, status: "waiting_cashier" });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const { id } = await params;
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = cleanText(payload.action);
  const reason = cleanText(payload.reason);

  if (!reason) {
    return jsonError("Reason is required.");
  }

  const { data: sale, error: saleError } = await admin
    .from("pos_sales")
    .select("id,sale_no,status,salesperson_admin_user_id,total_amount,payment_method,customer_id,customer_is_member")
    .eq("id", id)
    .maybeSingle();

  if (saleError || !sale) {
    return jsonError(saleError?.message ?? "Sale was not found.", 404);
  }

  if (action === "cancel") {
    if (!canUseSalesDesk(guard.admin.role)) {
      return jsonError("Only sales, staff, admin, or owner can cancel waiting sales.", 403);
    }

    if (!editableStatuses.has(String(sale.status))) {
      return jsonError("Only waiting or returned sales can be cancelled.");
    }

    if (!canChangeOwnSale(guard.admin.role, sale.salesperson_admin_user_id, guard.admin.id)) {
      return jsonError("You can only cancel your own sales slips.", 403);
    }

    const { error } = await admin
      .from("pos_sales")
      .update({ status: "cancelled", sale_notes: reason, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return jsonError(error.message, 500);
    }

    await writePosSaleAuditLog({
      supabase: admin,
      saleId: id,
      action: "cancelled",
      admin: guard.admin,
      previousStatus: sale.status,
      newStatus: "cancelled",
      reason,
      snapshot: { saleNo: sale.sale_no, amount: sale.total_amount },
    });

    return NextResponse.json({ ok: true, saleId: id, status: "cancelled" });
  }

  if (action === "return_to_sales") {
    if (!canUseCashierCenter(guard.admin.role)) {
      return jsonError("Only cashier, admin, or owner can return sales to Sales Desk.", 403);
    }

    if (sale.status !== "waiting_cashier") {
      return jsonError("Only waiting cashier sales can be returned to sales.");
    }

    const { error } = await admin
      .from("pos_sales")
      .update({ status: "returned_to_sales", sale_notes: reason, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return jsonError(error.message, 500);
    }

    await writePosSaleAuditLog({
      supabase: admin,
      saleId: id,
      action: "returned_to_sales",
      admin: guard.admin,
      previousStatus: sale.status,
      newStatus: "returned_to_sales",
      reason,
      snapshot: { saleNo: sale.sale_no, amount: sale.total_amount },
    });

    return NextResponse.json({ ok: true, saleId: id, status: "returned_to_sales" });
  }

  if (action === "void_paid") {
    if (!isOwnerOrAdmin(guard.admin.role)) {
      return jsonError("Only admin or owner can void paid sales.", 403);
    }

    if (sale.status !== "paid") {
      return jsonError("Only paid sales can be voided.");
    }

    const amount = Number(sale.total_amount ?? 0);
    const { error: paymentAdjustmentError } = await admin.from("pos_payment_confirmations").insert({
      sale_id: sale.id,
      cashier_admin_user_id: guard.admin.id,
      cashier_name_snapshot: guard.admin.name || guard.admin.email,
      payment_method: sale.payment_method,
      amount: Math.round(-amount * 100) / 100,
      notes: `Void paid sale: ${reason}`,
    });

    if (paymentAdjustmentError) {
      return jsonError(paymentAdjustmentError.message, 500);
    }

    const { error: updateError } = await admin
      .from("pos_sales")
      .update({ status: "voided", sale_notes: reason, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      return jsonError(updateError.message, 500);
    }

    if (sale.customer_is_member && sale.customer_id) {
      const { data: pointsRow } = await admin
        .from("customer_loyalty_point_transactions")
        .select("points")
        .eq("source_type", "pos_sale")
        .eq("source_id", id)
        .maybeSingle();
      const points = Number(pointsRow?.points ?? 0);

      if (points > 0) {
        const { data: customer } = await admin.from("customers").select("points_balance").eq("id", sale.customer_id).maybeSingle();
        const nextBalance = Math.max(0, Number(customer?.points_balance ?? 0) - points);
        await admin.from("customer_loyalty_point_transactions").insert({
          customer_id: sale.customer_id,
          source_type: "manual_adjustment",
          source_id: id,
          points: -points,
          amount: -amount,
          note: `Void POS sale ${sale.sale_no}: ${reason}`,
          created_by_admin_user_id: guard.admin.id,
        });
        await admin.from("customers").update({ points_balance: nextBalance }).eq("id", sale.customer_id);
      }
    }

    await writePosSaleAuditLog({
      supabase: admin,
      saleId: id,
      action: "voided_paid_sale",
      admin: guard.admin,
      previousStatus: sale.status,
      newStatus: "voided",
      reason,
      snapshot: { saleNo: sale.sale_no, amount, paymentMethod: sale.payment_method },
    });

    return NextResponse.json({ ok: true, saleId: id, status: "voided" });
  }

  return jsonError("Unsupported POS sale action.");
}
