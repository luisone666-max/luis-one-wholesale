import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

function parseEnv(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...value] = line.split("=");
        return [key, value.join("=")];
      }),
  );
}

function properDesign(value) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => (part.length <= 2 && /^\d+#?$|^[a-z]$/.test(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ")
    .replace(/\bKt\b/g, "Kitty")
    .replace(/\bThec\b/g, "THEC")
    .replace(/\bUsa\b/g, "USA");
}

function designFromSku(sku, prefix) {
  return sku
    .replace(prefix, "")
    .replace(/-BLACK$|-WHITE$|-BLUE$|-M-BLACK-SILVER$|-M-BLACK$|-M-SILVER$/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nextName(product) {
  const sku = product.sku;

  if (sku.includes("HNJ-A4-010-K-")) {
    return `HNJ A4-010-K ${properDesign(designFromSku(sku, "HLM-HNJ-A4-010-K-"))} Kids Helmet`;
  }

  if (sku.includes("TITAN-A4-004-K-")) {
    return `TITAN A4-004-K ${properDesign(designFromSku(sku, "HLM-TITAN-A4-004-K-").replace(/^\d+\s+/, ""))} Kids Helmet`;
  }

  if (sku.includes("XT02-")) {
    return `HNJ XT02 ${properDesign(designFromSku(sku, "HLM-XT02-").replace(/^\d+\s+/, ""))} Half Face Helmet`;
  }

  if (sku.includes("HNJ-2025-PLAIN-EDGE")) {
    return "HNJ 2025 Edge M-Black Silver Plain Full Face Helmet";
  }

  if (sku.includes("HNJ-2025-PLAIN-LUNA")) {
    return "HNJ 2025 Luna Blue Black Plain Full Face Helmet";
  }

  if (sku.includes("HNJ-2025-PLAIN-SHADOW")) {
    return "HNJ 2025 Shadow Black Plain Full Face Helmet";
  }

  if (sku === "HLM-HNJ-601-PLAIN-BLACK-2") {
    return "HNJ 601 Plain Black Modular Helmet";
  }

  if (sku === "HLM-HNJ-601-PLAIN-BLACK") {
    return "HNJ 601 Plain Modular Helmet";
  }

  return product.name;
}

const env = parseEnv(await readFile(".env.local", "utf8"));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: products, error } = await db.from("products").select("id,sku,name").order("sku");

if (error) {
  throw error;
}

const summary = { updated: 0, examples: [] };

for (const product of products ?? []) {
  const name = nextName(product);

  if (name === product.name) {
    continue;
  }

  const { error: updateError } = await db.from("products").update({ name }).eq("id", product.id);

  if (updateError) {
    throw updateError;
  }

  summary.updated += 1;

  if (summary.examples.length < 40) {
    summary.examples.push({ sku: product.sku, before: product.name, after: name });
  }
}

console.log(JSON.stringify(summary, null, 2));
