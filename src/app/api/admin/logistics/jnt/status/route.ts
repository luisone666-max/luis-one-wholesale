import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { getJntConfigStatus } from "@/lib/jnt-logistics";

export async function GET(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  return NextResponse.json({
    ok: true,
    status: getJntConfigStatus(),
  });
}
