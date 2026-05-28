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

function titleFromSku(sku) {
  const parts = sku
    .replace(/^(HLM|BOX|ACC)-/, "")
    .split("-")
    .filter(Boolean);
  const stopWords = new Set(["HNJ", "ZEBRA", "TITAN", "MOB", "PLAIN", "W", "D", "BLACK", "WHITE"]);
  const useful = parts.filter((part) => !stopWords.has(part));

  return useful
    .slice(-4)
    .join(" ")
    .replace(/\bKT\b/g, "Kitty")
    .replace(/\bCAT AND MOUSE\b/g, "Cat And Mouse")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanName(name) {
  return name
    .replace(/\bMOB MOB-/g, "MOB-")
    .replace(/^HNJ TITAN /, "TITAN ")
    .replace(/\bMetal Plate (\d+L) Metal Plate Top Box\b/g, "$1 Metal Plate Top Box")
    .replace(/\bKnee Pad Motorcycle Knee Pad\b/g, "Motorcycle Knee Pad")
    .replace(/\s+/g, " ")
    .trim();
}

const env = parseEnv(await readFile(".env.local", "utf8"));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: products, error } = await db.from("products").select("id,sku,name").order("sku");

if (error) {
  throw error;
}

const byName = new Map();

for (const product of products ?? []) {
  byName.set(product.name, [...(byName.get(product.name) ?? []), product]);
}

const updates = [];

for (const product of products ?? []) {
  const duplicateGroup = byName.get(product.name) ?? [];
  let name = cleanName(product.name);

  if (duplicateGroup.length > 1) {
    const suffix = titleFromSku(product.sku);

    if (suffix && !name.toUpperCase().includes(suffix.toUpperCase())) {
      name = name.replace(/ (Half Face Helmet|Full Face Helmet|Modular Helmet|Kids Helmet)$/, ` - ${suffix} $1`);
    }
  }

  if (name !== product.name) {
    updates.push({ ...product, nextName: name });
  }
}

const summary = { updated: 0, examples: [] };

for (const update of updates) {
  const { error: updateError } = await db.from("products").update({ name: update.nextName }).eq("id", update.id);

  if (updateError) {
    throw updateError;
  }

  summary.updated += 1;

  if (summary.examples.length < 40) {
    summary.examples.push({ sku: update.sku, before: update.name, after: update.nextName });
  }
}

console.log(JSON.stringify(summary, null, 2));
