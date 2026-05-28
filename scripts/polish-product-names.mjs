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

function cleanName(name) {
  return name
    .replace(/\bHEXA HEXA-/g, "HEXA-")
    .replace(/\bHNJ (45L DEFENDER|58L DEFENDER) \d+L Top Box/g, "HNJ $1 Top Box")
    .replace(/\bmetal Plate\b/g, "Metal Plate")
    .replace(/\bwith Light\b/g, "With Light")
    .replace(/\bwith LED\b/g, "With LED")
    .replace(/\bFull\(silver\)/g, "Full Silver")
    .replace(/\bSteenless\b/gi, "Stainless")
    .replace(/\bKNEEPAD\b/g, "Knee Pad")
    .replace(/\bVISOR\b/g, "Visor")
    .replace(/\bPLAIN\b/g, "Plain")
    .replace(/\bCLEAR\b/g, "Clear")
    .replace(/\bTAWNY\b/g, "Tawny")
    .replace(/\s+/g, " ")
    .trim();
}

const env = parseEnv(await readFile(".env.local", "utf8"));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: products, error } = await db.from("products").select("id,sku,name").order("sku");

if (error) {
  throw error;
}

const summary = { updated: 0, examples: [] };

for (const product of products ?? []) {
  const nextName = cleanName(product.name);

  if (nextName === product.name) {
    continue;
  }

  const { error: updateError } = await db.from("products").update({ name: nextName }).eq("id", product.id);

  if (updateError) {
    throw updateError;
  }

  summary.updated += 1;

  if (summary.examples.length < 30) {
    summary.examples.push({ sku: product.sku, before: product.name, after: nextName });
  }
}

console.log(JSON.stringify(summary, null, 2));
