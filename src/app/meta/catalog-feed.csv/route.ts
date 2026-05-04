import { NextResponse } from "next/server";
import { getCatalogSnapshot } from "@/lib/catalog-data";
import { buildMetaCatalogCsv } from "@/lib/meta-catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const catalog = await getCatalogSnapshot();
  const csv = buildMetaCatalogCsv(catalog.data.products);

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      "content-disposition": 'inline; filename="luis-one-meta-catalog-feed.csv"',
    },
  });
}
