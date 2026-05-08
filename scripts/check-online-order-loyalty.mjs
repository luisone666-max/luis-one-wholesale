import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const TEST_NOTE = "maintenance-online-order-loyalty-check";

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

function calculatePoints(amount) {
  const value = Number(amount ?? 0);
  return Number.isFinite(value) && value > 0 ? Math.floor(value / 100) : 0;
}

async function getCustomerBalance(supabase, customerId) {
  const { data, error } = await supabase.from("customers").select("points_balance").eq("id", customerId).maybeSingle();

  if (error) {
    throw new Error(`customer balance check failed: ${error.message}`);
  }

  return Number(data?.points_balance ?? 0);
}

async function cleanup(supabase, orderId, customerId) {
  if (orderId) {
    await supabase.from("customer_loyalty_point_transactions").delete().eq("source_id", orderId);
    await supabase.from("payment_records").delete().eq("order_id", orderId);
    await supabase.from("order_items").delete().eq("order_id", orderId);
    await supabase.from("orders").delete().eq("id", orderId);
  }

  await supabase.from("customer_loyalty_point_transactions").delete().eq("note", TEST_NOTE);

  if (customerId) {
    await supabase.from("customers").delete().eq("id", customerId);
  }
}

async function awardOnlineOrderPoints(supabase, order, adminUserId) {
  const points = calculatePoints(order.product_total);
  const { data, error } = await supabase.rpc("award_customer_loyalty_points", {
    p_customer_id: order.customer_id,
    p_source_type: "online_order",
    p_source_id: order.id,
    p_amount: order.product_total,
    p_points: points,
    p_note: TEST_NOTE,
    p_created_by_admin_user_id: adminUserId,
  });

  if (error) {
    throw new Error(`online loyalty award failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row?.awarded || Number(row.awarded_points ?? 0) !== points) {
    throw new Error("online order points were not awarded as expected.");
  }

  return points;
}

async function reverseOnlineOrderPoints(supabase, order, adminUserId, points) {
  const { data: adjustment, error: adjustmentError } = await supabase
    .from("customer_loyalty_point_transactions")
    .upsert(
      {
        customer_id: order.customer_id,
        source_type: "manual_adjustment",
        source_id: order.id,
        points: -points,
        amount: -Math.abs(money(order.product_total)),
        note: TEST_NOTE,
        created_by_admin_user_id: adminUserId,
      },
      { onConflict: "source_type,source_id", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();

  if (adjustmentError) {
    throw new Error(`online loyalty reversal insert failed: ${adjustmentError.message}`);
  }

  if (!adjustment) {
    throw new Error("online loyalty reversal was not inserted.");
  }

  const currentBalance = await getCustomerBalance(supabase, order.customer_id);
  const nextBalance = Math.max(0, currentBalance - points);
  const { error: customerError } = await supabase.from("customers").update({ points_balance: nextBalance }).eq("id", order.customer_id);

  if (customerError) {
    throw new Error(`online loyalty reversal balance update failed: ${customerError.message}`);
  }
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const env = parseEnv(await readFile(envPath, "utf8"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase server credentials are required for online order loyalty check.");
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  let orderId = "";
  let customerId = "";

  try {
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id,name,email,role,active")
      .eq("active", true)
      .in("role", ["owner", "admin", "cashier"])
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (adminError || !adminUser) {
      throw new Error(adminError?.message ?? "No active owner/admin/cashier found.");
    }

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        name: `Maintenance Online Loyalty Check ${Date.now()}`,
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
    const startingBalance = Number(customer.points_balance ?? 0);
    const productTotal = 250;
    const expectedPoints = calculatePoints(productTotal);
    const orderNo = `CHECK-ONLINE-LOYALTY-${Date.now().toString().slice(-8)}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_no: orderNo,
        customer_id: customer.id,
        product_total: productTotal,
        order_status: "pending_confirmation",
        payment_status: "no_payment",
        receiver_name: customer.name || "Test Customer",
        receiver_phone: customer.phone || "0000000000",
        receiving_method: "pickup",
        shipping_fee_payment_method: "no_shipping_fee",
        shipping_fee_status: "no_shipping_fee",
        order_notes: TEST_NOTE,
        admin_notes: TEST_NOTE,
      })
      .select("id,order_no,customer_id,product_total,payment_status,order_status")
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message ?? "online test order insert failed.");
    }

    orderId = order.id;

    const awardedPoints = await awardOnlineOrderPoints(supabase, order, adminUser.id);
    const afterAwardBalance = await getCustomerBalance(supabase, customer.id);

    if (awardedPoints !== expectedPoints || afterAwardBalance !== startingBalance + expectedPoints) {
      throw new Error(`online order points balance mismatch: expected ${startingBalance + expectedPoints}, got ${afterAwardBalance}`);
    }

    await supabase.from("orders").update({ payment_status: "fully_paid" }).eq("id", order.id);
    await reverseOnlineOrderPoints(supabase, order, adminUser.id, awardedPoints);
    await supabase.from("orders").update({ order_status: "cancelled" }).eq("id", order.id);

    const afterReverseBalance = await getCustomerBalance(supabase, customer.id);

    if (afterReverseBalance !== startingBalance) {
      throw new Error(`online order loyalty reversal mismatch: expected ${startingBalance}, got ${afterReverseBalance}`);
    }

    console.log("Online order loyalty check passed:");
    console.log(`- test order created: ${orderNo}`);
    console.log(`- member points awarded: ${awardedPoints}`);
    console.log("- cancellation/refund reversal returned member balance to original value");
  } finally {
    await cleanup(supabase, orderId, customerId);
    console.log("Temporary online loyalty test data cleaned.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
