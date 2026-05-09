import { NextResponse } from "next/server";
import { getSiteUrl, siteName } from "@/lib/seo";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: siteName,
      siteUrl: getSiteUrl(),
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
