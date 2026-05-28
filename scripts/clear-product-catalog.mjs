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
  const envPath = path.join(process.cwd(), ".env.local");
  const envText = await readFile(envPath, "utf8");
  return loadEnvFile(envText);
}

async function fetchAllRows(admin, table) {
  const pageSize = 1000;
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await admin.from(table).select("*").range(from, to);

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    rows.push(...(data ?? []));

    if (!data || data.length < pageSize) {
      return rows;
    }
  }
}

async function updateNullableReferences(admin, table) {
  const { error } = await admin
    .from(table)
    .update({ product_id: null, variant_id: null })
    .or("product_id.not.is.null,variant_id.not.is.null");

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
}

async function deleteRows(admin, table, column) {
  const { error } = await admin.from(table).delete().not(column, "is", null);

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
const backupDir = path.join(process.cwd(), "backups", `product-catalog-clear-${timestamp}`);
const tablesToBackup = [
  "products",
  "product_images",
  "product_price_tiers",
  "product_variants",
  "product_variant_price_tiers",
  "cart_items",
];
const counts = {};

await mkdir(backupDir, { recursive: true });

for (const table of tablesToBackup) {
  const rows = await fetchAllRows(admin, table);
  counts[table] = rows.length;
  await writeFile(path.join(backupDir, `${table}.json`), JSON.stringify(rows, null, 2));
}

await updateNullableReferences(admin, "order_items");
await updateNullableReferences(admin, "pos_sale_items");
await deleteRows(admin, "cart_items", "product_id");
await deleteRows(admin, "products", "id");

const remainingProducts = await fetchAllRows(admin, "products");

console.log(JSON.stringify({ backupDir, backedUpRows: counts, remainingProducts: remainingProducts.length }, null, 2));
