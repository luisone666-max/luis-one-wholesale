import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { canManageProducts } from "@/lib/admin-role-access";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const bucketName = "product-images";
const maxFileSize = 2 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function safeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

function safeFileName(value: string) {
  const parts = value.split(".");
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() ?? "" : "";
  const base = safeSlug(parts.join(".") || "image");
  const safeExtension = extension === "jpg" || extension === "jpeg" || extension === "png" || extension === "webp" ? extension : "jpg";

  return `${base}.${safeExtension}`;
}

async function ensureBucket(admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>) {
  const { data, error } = await admin.storage.getBucket(bucketName);

  if (data && !error) {
    return "";
  }

  const { error: createError } = await admin.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: maxFileSize,
    allowedMimeTypes: Array.from(allowedTypes),
  });

  return createError ? createError.message : "";
}

export async function POST(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (!guard.admin || !canManageProducts(guard.admin.role)) {
    return jsonError("Only product managers can upload product images.", 403);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return jsonError("Upload form data is required.");
  }

  const file = formData.get("file");
  const sku = typeof formData.get("sku") === "string" ? String(formData.get("sku")) : "";

  if (!(file instanceof File)) {
    return jsonError("Image file is required.");
  }

  if (!allowedTypes.has(file.type)) {
    return jsonError("Only JPG, PNG, and WebP image files are allowed.");
  }

  if (file.size > maxFileSize) {
    return jsonError("Image file must be 2MB or smaller.");
  }

  const bucketError = await ensureBucket(admin);

  if (bucketError) {
    return jsonError(bucketError, 500);
  }

  const timestamp = Date.now();
  const productFolder = safeSlug(sku || "new-product");
  const filePath = `products/${productFolder}/${timestamp}-${safeFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(bucketName).upload(filePath, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return jsonError(error.message, 500);
  }

  const { data } = admin.storage.from(bucketName).getPublicUrl(filePath);

  return NextResponse.json({ ok: true, imageUrl: data.publicUrl, path: filePath });
}
