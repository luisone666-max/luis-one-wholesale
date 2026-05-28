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

function safeSkuPart(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 38) || "VAR";
}

function parseColorVariants(description) {
  const match = description?.match(/Available colors\/sizes:\s*(.*?)\.\s*Final availability/i);

  if (!match || !match[1] || match[1].toLowerCase().includes("confirm before order")) {
    return [];
  }

  return match[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const sizeMatch = part.match(/^(.*?)\s*\((.*?)\)$/);
      return {
        name: sizeMatch ? sizeMatch[1].trim() : part,
        fits: sizeMatch ? `Sizes: ${sizeMatch[2].trim()}` : null,
      };
    });
}

const env = parseEnv(await readFile(".env.local", "utf8"));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: products, error } = await db
  .from("products")
  .select("id,sku,name,model,description,image_url,child_category:categories!products_child_category_id_fkey(name_en)")
  .order("sku");

if (error) {
  throw error;
}

const { data: existingVariants, error: existingVariantError } = await db.from("product_variants").select("variant_sku");

if (existingVariantError) {
  throw existingVariantError;
}

const usedVariantSkus = new Set((existingVariants ?? []).map((variant) => variant.variant_sku).filter(Boolean));
const summary = {
  productsWithVariants: 0,
  deletedExisting: 0,
  createdVariants: 0,
  errors: [],
};

function uniqueVariantSku(productSku, variantName) {
  const base = `${productSku}-${safeSkuPart(variantName)}`.slice(0, 95).replace(/-+$/g, "");
  let sku = base;
  let index = 2;

  while (usedVariantSkus.has(sku)) {
    sku = `${base}-${index}`.slice(0, 100);
    index += 1;
  }

  usedVariantSkus.add(sku);
  return sku;
}

for (const product of products ?? []) {
  try {
    const { data: images, error: imagesError } = await db
      .from("product_images")
      .select("image_url,sort_order")
      .eq("product_id", product.id)
      .order("sort_order");

    if (imagesError) {
      throw imagesError;
    }

    const imageUrls = (images ?? []).map((image) => image.image_url).filter(Boolean);
    const isTopBox = product.child_category?.name_en === "Top Boxes";
    const colorVariants = parseColorVariants(product.description);
    const variantDrafts = [];

    if (colorVariants.length) {
      for (const variant of colorVariants) {
        variantDrafts.push({
          variant_name: variant.name,
          variant_sku: uniqueVariantSku(product.sku, variant.name),
          model: product.model,
          fits: variant.fits,
          image_url: product.image_url,
          moq: 1,
          stock_status: "ready_stock",
          lead_time: "Confirm availability before release",
          active: true,
        });
      }
    } else if (isTopBox && imageUrls.length > 1) {
      for (let index = 0; index < imageUrls.length; index += 1) {
        const name = `Color / style ${index + 1}`;
        variantDrafts.push({
          variant_name: name,
          variant_sku: uniqueVariantSku(product.sku, `style-${index + 1}`),
          model: product.model,
          fits: null,
          image_url: imageUrls[index],
          moq: 1,
          stock_status: "ready_stock",
          lead_time: "Confirm exact color before release",
          active: true,
        });
      }
    }

    if (!variantDrafts.length) {
      continue;
    }

    const { data: oldVariants, error: oldVariantError } = await db.from("product_variants").select("id").eq("product_id", product.id);

    if (oldVariantError) {
      throw oldVariantError;
    }

    if (oldVariants?.length) {
      const { error: deleteError } = await db.from("product_variants").delete().eq("product_id", product.id);

      if (deleteError) {
        throw deleteError;
      }

      summary.deletedExisting += oldVariants.length;
    }

    const { error: insertError } = await db.from("product_variants").insert(
      variantDrafts.map((variant, index) => ({
        ...variant,
        product_id: product.id,
        sort_order: index,
      })),
    );

    if (insertError) {
      throw insertError;
    }

    summary.productsWithVariants += 1;
    summary.createdVariants += variantDrafts.length;
  } catch (error) {
    summary.errors.push(`${product.sku}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(JSON.stringify(summary, null, 2));

if (summary.errors.length) {
  process.exitCode = 1;
}
