import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  return NextResponse.json({ ok: true, admin: guard.admin });
}
