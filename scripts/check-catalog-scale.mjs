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

function assertOk(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function timed(label, fn) {
  const started = performance.now();
  const result = await fn();
  const ms = Math.round(performance.now() - started);
  console.log(`ok ${label} ${ms}ms`);
  return { result, ms };
}

function warnIfSlow(label, ms, limit) {
  if (ms > limit) {
    console.log(`warn ${label} took ${ms}ms; target is under ${limit}ms`);
  }
}

async function countRows(supabase, table, label, query = (request) => request) {
  const { result, ms } = await timed(`count ${label}`, async () => {
    const request = supabase.from(table).select("id", { count: "exact", head: true });
    return query(request);
  });

  if (result.error) {
    throw new Error(`${label} count failed: ${result.error.message}`);
  }

  warnIfSlow(`count ${label}`, ms, 3000);
  return result.count ?? 0;
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const env = parseEnv(await readFile(envPath, "utf8"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    throw new Error("Supabase URL, anon key, and service role key are required for catalog scale checks.");
  }

  const publicClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false } });

  const [publicProducts, allProducts, variants, priceTiers, images] = await Promise.all([
    countRows(publicClient, "customer_products", "public customer products", (request) => request.eq("active", true)),
    countRows(adminClient, "products", "admin products"),
    countRows(adminClient, "product_variants", "product variants"),
    countRows(adminClient, "product_price_tiers", "product price tiers"),
    countRows(adminClient, "product_images", "product images"),
  ]);

  console.log("");
  console.log(`catalog rows public=${publicProducts} products=${allProducts} variants=${variants} tiers=${priceTiers} images=${images}`);

  const { result: firstPageResult, ms: firstPageMs } = await timed("public product page query 48 rows", () =>
    publicClient
      .from("customer_products")
      .select("id,sku,name,slug,category_id,stock_status,moq,image_url")
      .eq("active", true)
      .order("name", { ascending: true })
      .range(0, 47),
  );

  if (firstPageResult.error) {
    throw new Error(`public product page query failed: ${firstPageResult.error.message}`);
  }

  warnIfSlow("public product page query", firstPageMs, 2500);
  assertOk((firstPageResult.data ?? []).length <= 48, "public product page query returned more than 48 rows");

  const pageProductIds = (firstPageResult.data ?? []).map((product) => product.id);
  const firstProduct = firstPageResult.data?.[0];

  if (pageProductIds.length) {
    const { ms: extrasMs } = await timed("page product extras query", async () => {
      const [tiersResult, imagesResult, variantsResult] = await Promise.all([
        publicClient.from("product_price_tiers").select("product_id,min_qty,max_qty,unit_price").in("product_id", pageProductIds),
        publicClient.from("product_images").select("product_id,image_url,sort_order").in("product_id", pageProductIds),
        publicClient
          .from("product_variants")
          .select("id,product_id,variant_name,variant_sku,image_url,moq,stock_status,active,sort_order")
          .in("product_id", pageProductIds)
          .eq("active", true),
      ]);

      for (const [label, result] of [
        ["price tiers", tiersResult],
        ["product images", imagesResult],
        ["product variants", variantsResult],
      ]) {
        if (result.error) {
          throw new Error(`${label} query failed: ${result.error.message}`);
        }
      }
    });

    warnIfSlow("page product extras query", extrasMs, 2500);
  }

  if (firstProduct?.slug) {
    const { result: detailResult, ms: detailMs } = await timed("single product detail lookup", () =>
      publicClient.from("customer_products").select("id,sku,name,slug,category_id,stock_status,moq,image_url").eq("slug", firstProduct.slug).eq("active", true).maybeSingle(),
    );

    if (detailResult.error) {
      throw new Error(`single product detail lookup failed: ${detailResult.error.message}`);
    }

    assertOk(Boolean(detailResult.data), `single product detail lookup did not find ${firstProduct.slug}`);
    warnIfSlow("single product detail lookup", detailMs, 1200);
  }

  const { result: adminPageResult, ms: adminPageMs } = await timed("admin product page query 48 rows", () =>
    adminClient
      .from("products")
      .select("id,sku,name,slug,category_id,subcategory_id,child_category_id,stock_status,active,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(0, 47),
  );

  if (adminPageResult.error) {
    throw new Error(`admin product page query failed: ${adminPageResult.error.message}`);
  }

  warnIfSlow("admin product page query", adminPageMs, 2500);
  assertOk((adminPageResult.data ?? []).length <= 48, "admin product page query returned more than 48 rows");

  console.log("");
  console.log("Catalog scale check passed.");
  console.log("For very large catalogs, keep product images in Supabase Storage and import products in batches.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
