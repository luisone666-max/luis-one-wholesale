import { NextResponse } from "next/server";
import { getCatalogSnapshot } from "@/lib/catalog-data";
import { buildMetaCatalogCsv } from "@/lib/meta-catalog";

export const revalidate = 300;

export async function GET() {
  const catalog = await getCatalogSnapshot();
  const csv = buildMetaCatalogCsv(catalog.data.products);

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
      "content-disposition": 'inline; filename="luis-one-meta-catalog-feed.csv"',
    },
  });
}
