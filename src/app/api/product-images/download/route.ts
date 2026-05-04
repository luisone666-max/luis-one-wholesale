import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);
const privateHostPatterns = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^0\./,
];

function safeFilename(value: string | null, fallback: string) {
  const name = (value || fallback)
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return name || fallback;
}

function contentTypeForExtension(extension: string) {
  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  if (extension === ".gif") {
    return "image/gif";
  }

  if (extension === ".svg") {
    return "image/svg+xml";
  }

  return "application/octet-stream";
}

function isPrivateHost(hostname: string) {
  return privateHostPatterns.some((pattern) => pattern.test(hostname));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get("url");
  const requestedName = safeFilename(url.searchParams.get("name"), "product-image");

  if (!imageUrl) {
    return NextResponse.json({ ok: false, message: "Image URL is required." }, { status: 400 });
  }

  if (imageUrl.startsWith("/") && !imageUrl.startsWith("//") && !imageUrl.includes("..")) {
    const extension = path.extname(imageUrl).toLowerCase();

    if (!allowedExtensions.has(extension)) {
      return NextResponse.json({ ok: false, message: "Unsupported image type." }, { status: 400 });
    }

    const publicPath = path.join(process.cwd(), "public", imageUrl);
    const file = await readFile(publicPath);

    return new Response(file, {
      headers: {
        "content-disposition": `attachment; filename="${requestedName}${extension}"`,
        "content-type": contentTypeForExtension(extension),
        "cache-control": "public, max-age=300",
      },
    });
  }

  const source = new URL(imageUrl);

  if (!["http:", "https:"].includes(source.protocol) || isPrivateHost(source.hostname)) {
    return NextResponse.json({ ok: false, message: "Unsupported image URL." }, { status: 400 });
  }

  const extension = path.extname(source.pathname).toLowerCase() || ".jpg";

  if (!allowedExtensions.has(extension)) {
    return NextResponse.json({ ok: false, message: "Unsupported image type." }, { status: 400 });
  }

  const response = await fetch(source, { cache: "no-store" });

  if (!response.ok) {
    return NextResponse.json({ ok: false, message: "Image could not be downloaded." }, { status: 404 });
  }

  return new Response(response.body, {
    headers: {
      "content-disposition": `attachment; filename="${requestedName}${extension}"`,
      "content-type": response.headers.get("content-type") || contentTypeForExtension(extension),
      "cache-control": "public, max-age=300",
    },
  });
}
