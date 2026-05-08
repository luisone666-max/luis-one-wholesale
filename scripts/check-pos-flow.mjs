import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const TEST_NOTE = "maintenance-pos-flow-check";

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

function todayManilaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dayBounds(date) {
  return {
    start: `${date}T00:00:00+08:00`,
    end: `${date}T23:59:59+08:00`,
  };
}

async function sumPayments(supabase, date, method) {
  const { start, end } = dayBounds(date);
  let query = supabase
    .from("pos_payment_confirmations")
    .select("amount,payment_method,confirmed_at")
    .gte("confirmed_at", start)
    .lte("confirmed_at", end);

  if (method) {
    query = query.eq("payment_method", method);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`payment total check failed: ${error.message}`);
  }

  return (data ?? []).reduce((total, row) => total + money(row.amount), 0);
}

async function cleanupTestArtifacts(supabase, saleId, customerId, deleteCustomer = false) {
  if (saleId) {
    await supabase.from("customer_loyalty_point_transactions").delete().eq("source_id", saleId);
    await supabase.from("pos_payment_confirmations").delete().eq("sale_id", saleId);
    await supabase.from("pos_sale_items").delete().eq("sale_id", saleId);
    await supabase.from("pos_sales").delete().eq("id", saleId);
  }

  await supabase.from("customer_loyalty_point_transactions").delete().eq("note", TEST_NOTE);

  if (deleteCustomer && customerId) {
    await supabase.from("customers").delete().eq("id", customerId);
    return;
  }

  if (customerId) {
    const { data, error } = await supabase
      .from("customer_loyalty_point_transactions")
      .select("points")
      .eq("customer_id", customerId);

    if (error) {
      throw new Error(`loyalty recalculation failed: ${error.message}`);
    }

    const total = (data ?? []).reduce((sum, row) => sum + Number(row.points ?? 0), 0);
    await supabase
      .from("customers")
      .update({ points_balance: total, lifetime_points: Math.max(total, 0) })
      .eq("id", customerId);
  }
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const env = parseEnv(await readFile(envPath, "utf8"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase server credentials are required for POS flow check.");
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  let saleId = "";
  let customerId = "";
  let deleteCustomer = false;

  try {
    const { data: salesperson, error: salespersonError } = await supabase
      .from("admin_users")
      .select("id,name,email,employee_no,active")
      .eq("active", true)
      .not("employee_no", "is", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (salespersonError || !salesperson?.employee_no) {
      throw new Error(salespersonError?.message ?? "No active salesperson with employee number found.");
    }

    const { data: cashier, error: cashierError } = await supabase
      .from("admin_users")
      .select("id,name,email,role,active")
      .eq("active", true)
      .in("role", ["cashier", "admin", "owner"])
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (cashierError || !cashier) {
      throw new Error(cashierError?.message ?? "No active cashier/admin/owner found.");
    }

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        name: `Maintenance POS Check ${Date.now()}`,
        phone: "0000000000",
        location: "Maintenance Check",
        business_type: "Test",
        status: "active",
      })
      .select("id,name,phone,points_balance,lifetime_points")
      .single();

    if (customerError || !customer) {
      throw new Error(customerError?.message ?? "Temporary customer insert failed.");
    }

    customerId = customer.id;
    deleteCustomer = true;

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id,sku,name,retail_price,active")
      .eq("active", true)
      .not("retail_price", "is", null)
      .gt("retail_price", 0)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (productError || !product) {
      throw new Error(productError?.message ?? "No active product with retail price found.");
    }

    const businessDate = todayManilaDate();
    const cashBefore = await sumPayments(supabase, businessDate, "cash");
    const pointsBefore = Number(customer.points_balance ?? 0);
    const unitPrice = Math.max(100, money(product.retail_price));
    const quantity = 2;
    const productTotal = money(unitPrice * quantity);
    const points = Math.floor(productTotal / 100);
    const saleNo = `CHECK-${businessDate.replaceAll("-", "")}-${Date.now().toString().slice(-6)}`;

    const { data: sale, error: saleError } = await supabase
      .from("pos_sales")
      .insert({
        sale_no: saleNo,
        salesperson_admin_user_id: salesperson.id,
        salesperson_employee_no: salesperson.employee_no,
        salesperson_name_snapshot: salesperson.name || salesperson.email || salesperson.employee_no,
        customer_id: customer.id,
        customer_name_snapshot: customer.name,
        customer_phone_snapshot: customer.phone || null,
        customer_is_member: true,
        payment_method: "cash",
        product_total: productTotal,
        discount_amount: 0,
        total_amount: productTotal,
        status: "waiting_cashier",
        sale_notes: TEST_NOTE,
      })
      .select("id,sale_no,status,total_amount")
      .single();

    if (saleError || !sale) {
      throw new Error(saleError?.message ?? "POS sale insert failed.");
    }

    saleId = sale.id;

    const { error: itemError } = await supabase.from("pos_sale_items").insert({
      sale_id: sale.id,
      product_id: product.id,
      item_name_snapshot: product.name,
      sku_snapshot: product.sku,
      quantity,
      unit_price: unitPrice,
      subtotal: productTotal,
      notes: TEST_NOTE,
    });

    if (itemError) {
      throw new Error(`POS item insert failed: ${itemError.message}`);
    }

    const { error: paymentError } = await supabase.from("pos_payment_confirmations").insert({
      sale_id: sale.id,
      cashier_admin_user_id: cashier.id,
      cashier_name_snapshot: cashier.name || cashier.email || "Cashier",
      payment_method: "cash",
      amount: productTotal,
      notes: TEST_NOTE,
    });

    if (paymentError) {
      throw new Error(`cashier confirmation insert failed: ${paymentError.message}`);
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("pos_sales")
      .update({
        status: "paid",
        cashier_admin_user_id: cashier.id,
        cashier_name_snapshot: cashier.name || cashier.email || "Cashier",
        cashier_confirmed_at: now,
        updated_at: now,
      })
      .eq("id", sale.id);

    if (updateError) {
      throw new Error(`POS sale paid update failed: ${updateError.message}`);
    }

    const { data: loyaltyRows, error: loyaltyError } = await supabase.rpc("award_customer_loyalty_points", {
      p_customer_id: customer.id,
      p_source_type: "pos_sale",
      p_source_id: sale.id,
      p_amount: productTotal,
      p_points: points,
      p_note: TEST_NOTE,
      p_created_by_admin_user_id: cashier.id,
    });

    if (loyaltyError) {
      throw new Error(`loyalty RPC failed: ${loyaltyError.message}`);
    }

    const loyaltyRow = Array.isArray(loyaltyRows) ? loyaltyRows[0] : loyaltyRows;

    if (!loyaltyRow?.awarded || Number(loyaltyRow.awarded_points) !== points) {
      throw new Error("loyalty points were not awarded as expected.");
    }

    const { data: paidSale, error: paidSaleError } = await supabase
      .from("pos_sales")
      .select("status,total_amount,cashier_confirmed_at")
      .eq("id", sale.id)
      .maybeSingle();

    if (paidSaleError || paidSale?.status !== "paid") {
      throw new Error(paidSaleError?.message ?? "POS sale was not marked paid.");
    }

    const { data: updatedCustomer, error: updatedCustomerError } = await supabase
      .from("customers")
      .select("points_balance")
      .eq("id", customer.id)
      .maybeSingle();

    if (updatedCustomerError || Number(updatedCustomer?.points_balance ?? 0) !== pointsBefore + points) {
      throw new Error(updatedCustomerError?.message ?? "customer points balance did not update.");
    }

    const cashAfter = await sumPayments(supabase, businessDate, "cash");
    const cashDelta = money(cashAfter - cashBefore);

    if (cashDelta !== productTotal) {
      throw new Error(`cash drawer source delta mismatch: expected ${productTotal}, got ${cashDelta}`);
    }

    console.log("POS flow check passed:");
    console.log(`- sale slip created: ${saleNo}`);
    console.log(`- cashier confirmation recorded: ${money(productTotal).toFixed(2)} PHP`);
    console.log(`- member points awarded: ${points}`);
    console.log("- cash drawer source totals changed correctly");
  } finally {
    await cleanupTestArtifacts(supabase, saleId, customerId, deleteCustomer);
    console.log("Temporary POS test data cleaned.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
