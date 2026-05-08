import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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

const checks = [
  {
    label: "Customer profiles and member points",
    table: "customers",
    columns: "id,name,phone,auth_user_id,points_balance,lifetime_points",
    migrationHint: "20260506007000_customer_loyalty_points.sql",
  },
  {
    label: "Admin users and staff roles",
    table: "admin_users",
    columns: "id,auth_user_id,email,name,role,active,employee_no,notes",
    migrationHint: "20260506003000_admin_staff_management.sql",
  },
  {
    label: "Owner password settings",
    table: "owner_security_settings",
    columns: "id,password_hash,password_salt,updated_by_admin_user_id,updated_at",
    migrationHint: "20260506004000_owner_security_settings.sql",
  },
  {
    label: "Products with retail price",
    table: "products",
    columns: "id,sku,name,slug,retail_price,stock_status,active",
    migrationHint: "20260504001000_product_retail_price.sql",
  },
  {
    label: "Product variants",
    table: "product_variants",
    columns: "id,product_id,variant_name,variant_sku,image_url,moq,stock_status,active",
    migrationHint: "20260503008000_product_variants.sql",
  },
  {
    label: "Product variant price tiers",
    table: "product_variant_price_tiers",
    columns: "id,variant_id,min_qty,max_qty,unit_price",
    migrationHint: "20260503008000_product_variants.sql",
  },
  {
    label: "Offline POS sales",
    table: "pos_sales",
    columns: "id,sale_no,salesperson_admin_user_id,customer_id,payment_method,total_amount,status,cashier_confirmed_at",
    migrationHint: "20260506005000_pos_sales_cashier_flow.sql",
  },
  {
    label: "Offline POS sale items",
    table: "pos_sale_items",
    columns: "id,sale_id,product_id,variant_id,item_name_snapshot,quantity,unit_price,subtotal",
    migrationHint: "20260506005000_pos_sales_cashier_flow.sql",
  },
  {
    label: "Offline POS payment confirmations",
    table: "pos_payment_confirmations",
    columns: "id,sale_id,cashier_admin_user_id,payment_method,amount,reference_no,confirmed_at",
    migrationHint: "20260506005000_pos_sales_cashier_flow.sql",
  },
  {
    label: "Offline POS correction audit logs",
    table: "pos_sale_audit_logs",
    columns: "id,sale_id,action,previous_status,new_status,reason,created_by_admin_user_id,created_at",
    migrationHint: "20260507001000_pos_sale_audit_logs.sql",
  },
  {
    label: "Admin sensitive action audit logs",
    table: "admin_action_audit_logs",
    columns: "id,admin_user_id,admin_email,admin_role,action,entity_type,entity_id,entity_label,created_at",
    migrationHint: "20260508001000_admin_action_audit_logs.sql",
  },
  {
    label: "Customer loyalty transactions",
    table: "customer_loyalty_point_transactions",
    columns: "id,customer_id,source_type,source_id,points,amount,note,created_by_admin_user_id",
    migrationHint: "20260506007000_customer_loyalty_points.sql",
  },
  {
    label: "Cash drawer sessions",
    table: "cash_drawer_sessions",
    columns: "id,business_date,opening_cash,expected_cash,actual_cash,status,cashier_admin_user_id",
    migrationHint: "20260506001000_cash_drawer.sql",
  },
];

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const env = parseEnv(await readFile(envPath, "utf8"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase server credentials are required for database schema check.");
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const failures = [];

  for (const check of checks) {
    const { error } = await supabase.from(check.table).select(check.columns).limit(1);

    if (error) {
      failures.push({ ...check, message: error.message });
      console.log(`missing ${check.label}: ${error.message}`);
      continue;
    }

    console.log(`ok ${check.label}`);
  }

  if (failures.length) {
    console.log("");
    console.log("Database schema check failed. Run the missing migrations in Supabase SQL Editor:");
    for (const failure of failures) {
      console.log(`- ${failure.migrationHint} (${failure.label})`);
    }
    process.exit(1);
  }

  console.log("Database schema check passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
