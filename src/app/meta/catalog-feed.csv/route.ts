import { NextResponse } from "next/server";
import { getCatalogSnapshot } from "@/lib/catalog-data";
import { buildMetaCatalogCsv } from "@/lib/meta-catalog";

export const revalidate = 3600;

export async function GET() {
  const catalog = await getCatalogSnapshot();
  const csv = buildMetaCatalogCsv(catalog.data.products);

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "content-disposition": 'inline; filename="luis-one-meta-catalog-feed.csv"',
    },
  });
}
