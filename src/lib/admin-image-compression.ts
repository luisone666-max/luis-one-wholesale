"use client";

export const ADMIN_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const ADMIN_IMAGE_MAX_EDGE = 1600;
export const ADMIN_ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type PreparedImage = {
  file: File;
  compressed: boolean;
  originalBytes: number;
};

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function safeBaseName(name: string) {
  const withoutExtension = name.replace(/\.[^.]+$/, "");

  return (
    withoutExtension
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "image"
  );
}

export function formatImageBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

export async function prepareAdminUploadImage(file: File): Promise<PreparedImage> {
  if (!ADMIN_ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, and WebP image files are allowed.");
  }

  const bitmap = await createImageBitmap(file);
  const largestEdge = Math.max(bitmap.width, bitmap.height);

  if (file.size <= ADMIN_IMAGE_MAX_BYTES && largestEdge <= ADMIN_IMAGE_MAX_EDGE) {
    bitmap.close();
    return { file, compressed: false, originalBytes: file.size };
  }

  const scale = Math.min(1, ADMIN_IMAGE_MAX_EDGE / largestEdge);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    if (file.size <= ADMIN_IMAGE_MAX_BYTES) {
      return { file, compressed: false, originalBytes: file.size };
    }
    throw new Error("Image file must be 2MB or smaller.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  for (const quality of [0.86, 0.78, 0.68, 0.58, 0.48]) {
    const blob = await canvasToBlob(canvas, "image/webp", quality);

    if (!blob) {
      continue;
    }

    if (blob.size <= ADMIN_IMAGE_MAX_BYTES || quality === 0.48) {
      if (blob.size > ADMIN_IMAGE_MAX_BYTES && file.size > ADMIN_IMAGE_MAX_BYTES) {
        break;
      }

      const compressedFile = new File([blob], `${safeBaseName(file.name)}.webp`, {
        type: "image/webp",
        lastModified: Date.now(),
      });

      return { file: compressedFile, compressed: true, originalBytes: file.size };
    }
  }

  if (file.size <= ADMIN_IMAGE_MAX_BYTES) {
    return { file, compressed: false, originalBytes: file.size };
  }

  throw new Error("Image file must be 2MB or smaller after optimization.");
}
