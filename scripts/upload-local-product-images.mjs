import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
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

function safeSegment(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72) || "product";
}

async function prepareImage(localPath) {
  const original = await readFile(localPath);
  const image = sharp(original, { limitInputPixels: false }).rotate();
  const metadata = await image.metadata();
  const maxSide = Math.max(metadata.width ?? 0, metadata.height ?? 0);

  if (original.length <= 3_500_000 && maxSide <= 1800) {
    return { bytes: original, ext: path.extname(localPath).toLowerCase() || ".png", contentType: "image/png" };
  }

  let bytes = await image
    .resize({ width: 1100, height: 1100, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 64 })
    .toBuffer();

  if (bytes.length > 3_500_000) {
    bytes = await sharp(original, { limitInputPixels: false })
      .rotate()
      .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 56 })
      .toBuffer();
  }

  return { bytes, ext: ".webp", contentType: "image/webp" };
}

const limit = Number(process.argv[2] ?? 20);
const env = parseEnv(await readFile(".env.local", "utf8"));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: products, error } = await db.from("products").select("id,sku,image_url").order("sku");

if (error) {
  throw error;
}

const localProducts = (products ?? []).filter((product) => product.image_url && !product.image_url.startsWith("http")).slice(0, limit);
const result = { attempted: localProducts.length, uploaded: 0, updatedProducts: 0, updatedImages: 0, errors: [] };

for (const product of localProducts) {
  try {
    const { data: imageRows, error: imageError } = await db
      .from("product_images")
      .select("image_url,sort_order")
      .eq("product_id", product.id)
      .order("sort_order");

    if (imageError) {
      throw imageError;
    }

    const urls = imageRows?.length ? imageRows.map((row) => row.image_url) : [product.image_url];
    const publicUrls = [];

    for (let index = 0; index < urls.length; index += 1) {
      const url = urls[index];

      if (!url || url.startsWith("http")) {
        if (url) {
          publicUrls.push(url);
        }
        continue;
      }

      const localPath = path.join(process.cwd(), "public", url.replace(/^\//, ""));

      if (!existsSync(localPath)) {
        throw new Error(`Missing local file ${url}`);
      }

      const prepared = await prepareImage(localPath);
      const hash = crypto.createHash("sha1").update(prepared.bytes).digest("hex").slice(0, 10);
      const objectPath = `products/imported/${safeSegment(product.sku)}/${String(index + 1).padStart(2, "0")}-${hash}${prepared.ext}`;
      const { error: uploadError } = await db.storage.from("product-images").upload(objectPath, prepared.bytes, {
        contentType: prepared.contentType,
        upsert: true,
      });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = db.storage.from("product-images").getPublicUrl(objectPath);
      publicUrls.push(data.publicUrl);
      result.uploaded += 1;
    }

    if (!publicUrls.length) {
      continue;
    }

    const { error: productError } = await db.from("products").update({ image_url: publicUrls[0] }).eq("id", product.id);

    if (productError) {
      throw productError;
    }

    await db.from("product_images").delete().eq("product_id", product.id);

    const { error: insertError } = await db.from("product_images").insert(
      publicUrls.map((url, index) => ({
        product_id: product.id,
        image_url: url,
        sort_order: index,
      })),
    );

    if (insertError) {
      throw insertError;
    }

    result.updatedProducts += 1;
    result.updatedImages += publicUrls.length;
  } catch (error) {
    result.errors.push(`${product.sku}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(JSON.stringify(result, null, 2));

if (result.errors.length) {
  process.exitCode = 1;
}
