import { NextResponse } from "next/server";
import {
  importBulkProductRows,
  previewBulkProductRows,
  type BulkImportMissingCategoryMode,
  type BulkProductCsvRow,
} from "@/lib/admin-product-bulk-upload";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function adminDevAccessAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.ADMIN_DEV_ACCESS === "true";
}

function parseRows(value: unknown): BulkProductCsvRow[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const rows = value.flatMap((row) => {
    const item = row as Record<string, unknown>;
    const rowNumber = Number(item.rowNumber);
    const data = item.data;

    if (!Number.isInteger(rowNumber) || rowNumber < 2 || typeof data !== "object" || data === null || Array.isArray(data)) {
      return [];
    }

    const normalizedData = Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([key, cell]) => [key, typeof cell === "string" ? cell : String(cell ?? "")]),
    );

    return [{ rowNumber, data: normalizedData }];
  });

  return rows.length ? rows : null;
}

function parseMissingCategoryMode(value: unknown): BulkImportMissingCategoryMode {
  return value === "skip" ? "skip" : "create_inactive";
}

export async function POST(request: Request) {
  if (!adminDevAccessAllowed()) {
    return jsonError("Admin API is disabled until admin authentication is added.", 403);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const rows = parseRows(body.rows);

  if (!rows) {
    return jsonError("Upload a CSV file with product rows first.");
  }

  const mode = body.mode === "import" ? "import" : "preview";
  const missingCategoryMode = parseMissingCategoryMode(body.missingCategoryMode);

  try {
    if (mode === "import") {
      const result = await importBulkProductRows(rows, missingCategoryMode);
      return NextResponse.json({ ok: true, ...result });
    }

    const preview = await previewBulkProductRows(rows, missingCategoryMode);
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Bulk upload failed.", 500);
  }
}
