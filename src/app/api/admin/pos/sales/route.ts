import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { canUseCashierCenter, canUseSalesDesk } from "@/lib/admin-role-access";
import { getPosSales } from "@/lib/pos-data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const paymentMethods = new Set(["cash", "gcash", "bank_transfer", "other"]);

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

async function generateSaleNo(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const saleNo = `POS-${datePart}-${suffix}`;
    const { data } = await admin!.from("pos_sales").select("id").eq("sale_no", saleNo).maybeSingle();

    if (!data) {
      return saleNo;
    }
  }

  return `POS-${datePart}-${Date.now().toString().slice(-6)}`;
}

export async function GET(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const status = url.searchParams.get("status") ?? undefined;

  if (scope === "mine") {
    if (!canUseSalesDesk(guard.admin.role)) {
      return jsonError("Only sales, staff, admin, or owner can view their own offline sales.", 403);
    }

    const result = await getPosSales(status, { salespersonAdminUserId: guard.admin.id, limit: 12 });

    if (result.error) {
      return jsonError(result.error, 500);
    }

    return NextResponse.json({ ok: true, sales: result.sales });
  }

  if (!canUseCashierCenter(guard.admin.role)) {
    return jsonError("Only cashier, admin, or owner can view waiting cashier sales.", 403);
  }

  const result = await getPosSales(status);

  if (result.error) {
    return jsonError(result.error, 500);
  }

  return NextResponse.json({ ok: true, sales: result.sales });
}

export async function POST(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (!canUseSalesDesk(guard.admin.role)) {
    return jsonError("Only sales, staff, admin, or owner can create offline sales.", 403);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const employeeNo = cleanText(payload.employeeNo);
  const customerName = cleanText(payload.customerName);
  const customerPhone = cleanText(payload.customerPhone);
  const paymentMethod = cleanText(payload.paymentMethod) || "cash";
  const priceChangeNotes = cleanText(payload.priceChangeNotes);
  const saleNotes = cleanText(payload.saleNotes);
  const discountAmount = money(payload.discountAmount) ?? 0;
  const customerId = cleanText(payload.customerId);
  const customerIsMember = Boolean(payload.customerIsMember || customerId);

  if (!employeeNo) {
    return jsonError("Sales employee number is required.");
  }

  if ((guard.admin.role === "sales" || guard.admin.role === "staff") && guard.admin.employeeNo !== employeeNo) {
    return jsonError("Sales staff can only create sales using their own employee number.", 403);
  }

  if (!customerName) {
    return jsonError("Customer name is required.");
  }

  if (!paymentMethods.has(paymentMethod)) {
    return jsonError("Payment method is invalid.");
  }

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

  if (!items.length) {
    return jsonError("At least one sale item is required.");
  }

  const { data: salesperson, error: salespersonError } = await admin
    .from("admin_users")
    .select("id,name,email,employee_no,active")
    .eq("employee_no", employeeNo)
    .eq("active", true)
    .maybeSingle();

  if (salespersonError || !salesperson) {
    return jsonError(salespersonError?.message ?? "Sales employee number was not found.", 404);
  }

  const productTotal = Math.round(items.reduce((total, item) => total + item.subtotal, 0) * 100) / 100;

  if (discountAmount > productTotal) {
    return jsonError("Discount cannot be greater than product total.");
  }

  const totalAmount = Math.max(0, Math.round((productTotal - discountAmount) * 100) / 100);
  const saleNo = await generateSaleNo(admin);
  const { data: sale, error: saleError } = await admin
    .from("pos_sales")
    .insert({
      sale_no: saleNo,
      salesperson_admin_user_id: salesperson.id,
      salesperson_employee_no: employeeNo,
      salesperson_name_snapshot: salesperson.name || salesperson.email || employeeNo,
      customer_id: customerId || null,
      customer_name_snapshot: customerName,
      customer_phone_snapshot: customerPhone || null,
      customer_is_member: customerIsMember,
      payment_method: paymentMethod,
      product_total: productTotal,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      status: "waiting_cashier",
      price_change_notes: priceChangeNotes || null,
      sale_notes: saleNotes || null,
    })
    .select("id,sale_no")
    .single();

  if (saleError || !sale) {
    return jsonError(saleError?.message ?? "Sale creation failed.", 500);
  }

  const { error: itemsError } = await admin.from("pos_sale_items").insert(items.map((item) => ({ ...item, sale_id: sale.id })));

  if (itemsError) {
    await admin.from("pos_sales").delete().eq("id", sale.id);
    return jsonError(itemsError.message, 500);
  }

  return NextResponse.json({ ok: true, saleNo: sale.sale_no, saleId: sale.id });
}
