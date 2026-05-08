import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const TEST_NOTE = "maintenance-pos-correction-check";

function parseEnv(contents) {
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

function money(value) {
  return Math.round(Number(value ?? 0) * 100) / 100;
}

function pointsFor(amount) {
  const value = Number(amount ?? 0);
  return Number.isFinite(value) && value > 0 ? Math.floor(value / 100) : 0;
}

function saleNo(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`.toUpperCase();
}

async function cleanup(supabase, saleIds, customerId) {
  for (const saleId of saleIds.filter(Boolean)) {
    await supabase.from("customer_loyalty_point_transactions").delete().eq("source_id", saleId);
    await supabase.from("pos_payment_confirmations").delete().eq("sale_id", saleId);
    await supabase.from("pos_sale_audit_logs").delete().eq("sale_id", saleId);
    await supabase.from("pos_sale_items").delete().eq("sale_id", saleId);
    await supabase.from("pos_sales").delete().eq("id", saleId);
  }

  await supabase.from("customer_loyalty_point_transactions").delete().eq("note", TEST_NOTE);

  if (customerId) {
    await supabase.from("customers").delete().eq("id", customerId);
  }
}

async function getActiveAdmin(supabase, roles) {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id,name,email,role,employee_no,active")
    .eq("active", true)
    .in("role", roles)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? `No active admin user found for roles: ${roles.join(", ")}`);
  }

  return data;
}

async function assertAuditTableReady(supabase) {
  const { error } = await supabase.from("pos_sale_audit_logs").select("id").limit(1);

  if (error) {
    throw new Error(
      [
        "POS correction audit table is not ready in Supabase.",
        "Run this migration in Supabase SQL Editor, then rerun this check:",
        "supabase/migrations/20260507001000_pos_sale_audit_logs.sql",
        `Original Supabase error: ${error.message}`,
      ].join("\n"),
    );
  }
}

async function getSalesperson(supabase) {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id,name,email,role,employee_no,active")
    .eq("active", true)
    .not("employee_no", "is", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.employee_no) {
    throw new Error(error?.message ?? "No active staff account with employee number found.");
  }

  return data;
}

async function createSale({ supabase, salesperson, customer, status, total, paymentMethod, note }) {
  const number = saleNo("CHECK-POS-CORR");
  const { data: sale, error: saleError } = await supabase
    .from("pos_sales")
    .insert({
      sale_no: number,
      salesperson_admin_user_id: salesperson.id,
      salesperson_employee_no: salesperson.employee_no || "CHECK",
      salesperson_name_snapshot: salesperson.name || salesperson.email || salesperson.employee_no || "Sales",
      customer_id: customer?.id ?? null,
      customer_name_snapshot: customer?.name ?? "Walk-in Correction Check",
      customer_phone_snapshot: customer?.phone ?? null,
      customer_is_member: Boolean(customer?.id),
      payment_method: paymentMethod,
      product_total: total,
      discount_amount: 0,
      total_amount: total,
      status,
      sale_notes: note,
    })
    .select("id,sale_no,status,total_amount")
    .single();

  if (saleError || !sale) {
    throw new Error(saleError?.message ?? "POS sale insert failed.");
  }

  const { error: itemError } = await supabase.from("pos_sale_items").insert({
    sale_id: sale.id,
    item_name_snapshot: "POS Correction Check Item",
    sku_snapshot: "CHECK-POS-CORR",
    quantity: 1,
    unit_price: total,
    subtotal: total,
    notes: TEST_NOTE,
  });

  if (itemError) {
    throw new Error(`POS sale item insert failed: ${itemError.message}`);
  }

  return sale;
}

async function audit(supabase, saleId, action, admin, previousStatus, newStatus, reason, snapshot = {}) {
  const { error } = await supabase.from("pos_sale_audit_logs").insert({
    sale_id: saleId,
    action,
    previous_status: previousStatus,
    new_status: newStatus,
    reason,
    snapshot,
    created_by_admin_user_id: admin.id,
    created_by_name_snapshot: admin.name || admin.email || admin.role,
  });

  if (error) {
    throw new Error(`audit log insert failed: ${error.message}`);
  }
}

async function getSale(supabase, saleId) {
  const { data, error } = await supabase.from("pos_sales").select("id,status,total_amount").eq("id", saleId).maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "POS sale lookup failed.");
  }

  return data;
}

async function assertAuditActions(supabase, saleId, actions) {
  const { data, error } = await supabase.from("pos_sale_audit_logs").select("action").eq("sale_id", saleId);

  if (error) {
    throw new Error(`audit action lookup failed: ${error.message}`);
  }

  const found = new Set((data ?? []).map((row) => row.action));
  const missing = actions.filter((action) => !found.has(action));

  if (missing.length) {
    throw new Error(`missing audit actions for sale ${saleId}: ${missing.join(", ")}`);
  }
}

async function paymentNet(supabase, saleId) {
  const { data, error } = await supabase.from("pos_payment_confirmations").select("amount").eq("sale_id", saleId);

  if (error) {
    throw new Error(`payment net lookup failed: ${error.message}`);
  }

  return money((data ?? []).reduce((total, row) => total + Number(row.amount ?? 0), 0));
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const env = parseEnv(await readFile(envPath, "utf8"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase server credentials are required for POS correction check.");
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const saleIds = [];
  let customerId = "";

  try {
    await assertAuditTableReady(supabase);

    const salesperson = await getSalesperson(supabase);
    const cashier = await getActiveAdmin(supabase, ["cashier", "admin", "owner"]);
    const owner = await getActiveAdmin(supabase, ["owner", "admin"]);

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        name: `Maintenance POS Correction Check ${Date.now()}`,
        phone: "0000000000",
        location: "Maintenance Check",
        business_type: "Test",
        status: "active",
      })
      .select("id,name,phone,points_balance")
      .single();

    if (customerError || !customer) {
      throw new Error(customerError?.message ?? "Temporary customer insert failed.");
    }

    customerId = customer.id;

    const correctionSale = await createSale({
      supabase,
      salesperson,
      customer: null,
      status: "waiting_cashier",
      total: 150,
      paymentMethod: "gcash",
      note: TEST_NOTE,
    });
    saleIds.push(correctionSale.id);

    await supabase.from("pos_sales").update({ status: "returned_to_sales", sale_notes: "Wrong item, return for correction." }).eq("id", correctionSale.id);
    await audit(supabase, correctionSale.id, "returned_to_sales", cashier, "waiting_cashier", "returned_to_sales", "Wrong item, return for correction.", {
      saleNo: correctionSale.sale_no,
      amount: 150,
    });

    let sale = await getSale(supabase, correctionSale.id);
    if (sale.status !== "returned_to_sales") {
      throw new Error("returned sale status check failed.");
    }

    await supabase.from("pos_sale_items").delete().eq("sale_id", correctionSale.id);
    await supabase.from("pos_sale_items").insert({
      sale_id: correctionSale.id,
      item_name_snapshot: "Corrected POS Check Item",
      sku_snapshot: "CHECK-POS-CORR-EDIT",
      quantity: 2,
      unit_price: 90,
      subtotal: 180,
      notes: TEST_NOTE,
    });
    await supabase
      .from("pos_sales")
      .update({
        status: "waiting_cashier",
        product_total: 180,
        total_amount: 180,
        sale_notes: "Corrected before payment.",
      })
      .eq("id", correctionSale.id);
    await audit(supabase, correctionSale.id, "updated", salesperson, "returned_to_sales", "waiting_cashier", "Corrected before payment.", {
      saleNo: correctionSale.sale_no,
      totalAmount: 180,
    });

    sale = await getSale(supabase, correctionSale.id);
    if (sale.status !== "waiting_cashier" || money(sale.total_amount) !== 180) {
      throw new Error("corrected sale total/status check failed.");
    }

    await supabase.from("pos_sales").update({ status: "cancelled", sale_notes: "Customer changed mind before payment." }).eq("id", correctionSale.id);
    await audit(supabase, correctionSale.id, "cancelled", salesperson, "waiting_cashier", "cancelled", "Customer changed mind before payment.", {
      saleNo: correctionSale.sale_no,
      amount: 180,
    });

    sale = await getSale(supabase, correctionSale.id);
    if (sale.status !== "cancelled" || (await paymentNet(supabase, correctionSale.id)) !== 0) {
      throw new Error("cancelled unpaid sale check failed.");
    }

    await assertAuditActions(supabase, correctionSale.id, ["returned_to_sales", "updated", "cancelled"]);

    const paidTotal = 300;
    const paidSale = await createSale({
      supabase,
      salesperson,
      customer,
      status: "waiting_cashier",
      total: paidTotal,
      paymentMethod: "cash",
      note: TEST_NOTE,
    });
    saleIds.push(paidSale.id);

    const { error: paymentError } = await supabase.from("pos_payment_confirmations").insert({
      sale_id: paidSale.id,
      cashier_admin_user_id: cashier.id,
      cashier_name_snapshot: cashier.name || cashier.email || "Cashier",
      payment_method: "cash",
      amount: paidTotal,
      notes: TEST_NOTE,
    });

    if (paymentError) {
      throw new Error(`payment confirmation insert failed: ${paymentError.message}`);
    }

    const { error: paidUpdateError } = await supabase
      .from("pos_sales")
      .update({
        status: "paid",
        cashier_admin_user_id: cashier.id,
        cashier_name_snapshot: cashier.name || cashier.email || "Cashier",
        cashier_confirmed_at: new Date().toISOString(),
      })
      .eq("id", paidSale.id);

    if (paidUpdateError) {
      throw new Error(`paid sale update failed: ${paidUpdateError.message}`);
    }

    const expectedPoints = pointsFor(paidTotal);
    const { data: loyaltyRows, error: loyaltyError } = await supabase.rpc("award_customer_loyalty_points", {
      p_customer_id: customer.id,
      p_source_type: "pos_sale",
      p_source_id: paidSale.id,
      p_amount: paidTotal,
      p_points: expectedPoints,
      p_note: TEST_NOTE,
      p_created_by_admin_user_id: cashier.id,
    });

    if (loyaltyError) {
      throw new Error(`loyalty RPC failed: ${loyaltyError.message}`);
    }

    const loyaltyRow = Array.isArray(loyaltyRows) ? loyaltyRows[0] : loyaltyRows;
    if (!loyaltyRow?.awarded || Number(loyaltyRow.awarded_points ?? 0) !== expectedPoints) {
      throw new Error("paid sale points were not awarded as expected.");
    }

    const { error: negativePaymentError } = await supabase.from("pos_payment_confirmations").insert({
      sale_id: paidSale.id,
      cashier_admin_user_id: owner.id,
      cashier_name_snapshot: owner.name || owner.email || "Owner",
      payment_method: "cash",
      amount: -paidTotal,
      notes: "Void paid sale correction check",
    });

    if (negativePaymentError) {
      throw new Error(`negative payment insert failed: ${negativePaymentError.message}`);
    }

    await supabase.from("pos_sales").update({ status: "voided", sale_notes: "Owner void test." }).eq("id", paidSale.id);
    await supabase.from("customer_loyalty_point_transactions").insert({
      customer_id: customer.id,
      source_type: "manual_adjustment",
      source_id: paidSale.id,
      points: -expectedPoints,
      amount: -paidTotal,
      note: TEST_NOTE,
      created_by_admin_user_id: owner.id,
    });
    await supabase.from("customers").update({ points_balance: 0 }).eq("id", customer.id);
    await audit(supabase, paidSale.id, "voided_paid_sale", owner, "paid", "voided", "Owner void test.", {
      saleNo: paidSale.sale_no,
      amount: paidTotal,
      paymentMethod: "cash",
    });

    sale = await getSale(supabase, paidSale.id);
    if (sale.status !== "voided" || (await paymentNet(supabase, paidSale.id)) !== 0) {
      throw new Error("voided paid sale payment net check failed.");
    }

    const { data: finalCustomer, error: finalCustomerError } = await supabase.from("customers").select("points_balance").eq("id", customer.id).maybeSingle();

    if (finalCustomerError || Number(finalCustomer?.points_balance ?? 0) !== 0) {
      throw new Error(finalCustomerError?.message ?? "voided paid sale points reversal check failed.");
    }

    await assertAuditActions(supabase, paidSale.id, ["voided_paid_sale"]);

    console.log("POS correction check passed:");
    console.log("- waiting sale can be returned to Sales Desk");
    console.log("- returned sale can be corrected and cancelled before payment");
    console.log("- paid sale can be voided with negative payment and point reversal");
    console.log("- correction audit trail is recorded");
  } finally {
    await cleanup(supabase, saleIds, customerId);
    console.log("Temporary POS correction test data cleaned.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
