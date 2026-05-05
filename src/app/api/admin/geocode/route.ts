import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { geocodeAddress, getGoogleGeocodingConfigStatus } from "@/lib/google-geocoding";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function GET(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  return NextResponse.json({ ok: true, config: getGoogleGeocodingConfigStatus() });
}

export async function POST(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  const payload = (await request.json().catch(() => ({}))) as {
    address?: string;
  };

  if (!payload.address?.trim()) {
    return jsonError("Address is required.");
  }

  try {
    const result = await geocodeAddress(payload.address);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Google Geocoding failed.", 502);
  }
}
