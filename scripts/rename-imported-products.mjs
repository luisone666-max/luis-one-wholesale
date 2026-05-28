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

function clean(value) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function titleCaseLoose(value) {
  return clean(value)
    .split(" ")
    .map((part) => {
      if (/^[A-Z0-9#/-]+$/.test(part) || part.includes("-")) {
        return part;
      }

      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}

function removeBrandPrefix(name, brand) {
  if (!brand) {
    return name;
  }

  return clean(name).replace(new RegExp(`^${brand}\\s+`, "i"), "");
}

function extractCapacity(description) {
  return description?.match(/\b(\d+L)\b/i)?.[1].toUpperCase() ?? "";
}

function extractDetail(description, needle, label) {
  return description?.toLowerCase().includes(needle) ? label : "";
}

function normalizeHelmetName(product) {
  const brand = product.brand || (product.sku.startsWith("HLM-ZEBRA") ? "ZEBRA" : product.sku.startsWith("HLM-TITAN") ? "TITAN" : product.sku.startsWith("HLM-MOB") ? "MOB" : "HNJ");
  const base = titleCaseLoose(removeBrandPrefix(product.name, brand))
    .replace(/\bW\/D\b/g, "Graphic")
    .replace(/\bPLAIN\b/g, "Plain")
    .replace(/\bTINTED\b/g, "Tinted")
    .replace(/\bCLEAR\b/g, "Clear")
    .replace(/\s+-\s+/g, " - ");
  const type = product.child_category?.name_en?.replace(/Helmets$/, "Helmet") ?? "Helmet";

  return clean(`${brand} ${base} ${type}`);
}

function normalizeTopBoxName(product) {
  const brand = product.brand || (product.name.startsWith("HEXA") ? "HEXA" : product.name.startsWith("LINXI") ? "LINXI" : "HNJ");
  let base = titleCaseLoose(removeBrandPrefix(product.name, brand))
    .replace(/\bBOX\b/gi, "")
    .replace(/\bW\/LIGHT\b/gi, "With Light")
    .replace(/\bW\/LED\b/gi, "With LED")
    .replace(/[()]/g, " ");
  const capacity = extractCapacity(product.description);
  const metalPlate = extractDetail(product.description, "metal plate", "Metal Plate");
  const noBackrest = extractDetail(product.description, "no backrest", "No Backrest");

  base = clean(base);
  return clean(`${brand} ${base} ${capacity} ${metalPlate} Top Box ${noBackrest}`);
}

function normalizeAccessoryName(product) {
  const name = titleCaseLoose(product.name)
    .replace(/\bNMAX\b/gi, "NMAX")
    .replace(/\bAEROX\b/gi, "AEROX")
    .replace(/\bMIO\b/gi, "MIO")
    .replace(/\bHNJ\b/gi, "HNJ")
    .replace(/\bPRO-X\b/gi, "PRO-X");

  if (/gloves/i.test(product.name)) {
    return clean(`${name} Motorcycle Gloves`);
  }

  if (/kneepad/i.test(product.name)) {
    return clean(`${name} Motorcycle Knee Pad`);
  }

  if (/sungay/i.test(product.name)) {
    return clean(`${name} Helmet Horn Accessory`);
  }

  return clean(`${name} Motorcycle Bracket`);
}

function nextName(product) {
  const category = product.child_category?.name_en;

  if (category === "Top Boxes") {
    return normalizeTopBoxName(product);
  }

  if (category === "Brackets") {
    return normalizeAccessoryName(product);
  }

  if (category?.includes("Helmet")) {
    return normalizeHelmetName(product);
  }

  return product.name;
}

const env = parseEnv(await readFile(".env.local", "utf8"));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: products, error } = await db
  .from("products")
  .select("id,sku,name,brand,description,child_category:categories!products_child_category_id_fkey(name_en)")
  .order("sku");

if (error) {
  throw error;
}

const summary = { updated: 0, unchanged: 0, examples: [], errors: [] };

for (const product of products ?? []) {
  try {
    const name = nextName(product);

    if (!name || name === product.name) {
      summary.unchanged += 1;
      continue;
    }

    const { error: updateError } = await db.from("products").update({ name }).eq("id", product.id);

    if (updateError) {
      throw updateError;
    }

    summary.updated += 1;

    if (summary.examples.length < 30) {
      summary.examples.push({ sku: product.sku, before: product.name, after: name });
    }
  } catch (error) {
    summary.errors.push(`${product.sku}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(JSON.stringify(summary, null, 2));

if (summary.errors.length) {
  process.exitCode = 1;
}
