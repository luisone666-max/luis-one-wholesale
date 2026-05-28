import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(envText) {
  return Object.fromEntries(
    envText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...valueParts] = line.split("=");
        return [key, valueParts.join("=")];
      }),
  );
}

async function readEnv() {
  const envText = await readFile(path.join(process.cwd(), ".env.local"), "utf8");
  return loadEnvFile(envText);
}

async function fetchAllRows(admin, table) {
  const pageSize = 1000;
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin.from(table).select("*").range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    rows.push(...(data ?? []));

    if (!data || data.length < pageSize) {
      return rows;
    }
  }
}

async function deleteAllRows(admin, table) {
  const { error } = await admin.from(table).delete().not("id", "is", null);

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
}

const env = await readEnv();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(process.cwd(), "backups", `test-transactions-clear-${timestamp}`);
const tablesToBackup = [
  "orders",
  "order_items",
  "payment_records",
  "pos_sales",
  "pos_sale_items",
  "pos_payment_confirmations",
  "pos_sale_audit_logs",
  "cash_drawer_sessions",
  "cash_drawer_entries",
  "customer_loyalty_point_transactions",
];
const counts = {};

await mkdir(backupDir, { recursive: true });

for (const table of tablesToBackup) {
  const rows = await fetchAllRows(admin, table);
  counts[table] = rows.length;
  await writeFile(path.join(backupDir, `${table}.json`), JSON.stringify(rows, null, 2));
}

await deleteAllRows(admin, "orders");
await deleteAllRows(admin, "pos_sales");
await deleteAllRows(admin, "cash_drawer_sessions");
await deleteAllRows(admin, "customer_loyalty_point_transactions");

const { error: resetPointsError } = await admin
  .from("customers")
  .update({ points_balance: 0, lifetime_points: 0 })
  .not("id", "is", null);

if (resetPointsError) {
  throw new Error(`customers: ${resetPointsError.message}`);
}

const remaining = {};

for (const table of ["orders", "pos_sales", "cash_drawer_sessions", "customer_loyalty_point_transactions"]) {
  remaining[table] = (await fetchAllRows(admin, table)).length;
}

console.log(JSON.stringify({ backupDir, backedUpRows: counts, remaining }, null, 2));
