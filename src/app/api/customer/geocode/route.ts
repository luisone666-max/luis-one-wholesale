import { NextResponse } from "next/server";
import { geocodeAddress, reverseGeocodeCoordinates } from "@/lib/google-geocoding";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}

async function requireCustomerSession(request: Request) {
  const token = getBearerToken(request);
  const supabase = createServerSupabaseClient();

  if (!token || !supabase) {
    return { response: jsonError("Please login before checking delivery location.", 401) };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { response: jsonError("Your login session has expired. Please login again.", 401) };
  }

  return { response: null };
}

export async function POST(request: Request) {
  const guard = await requireCustomerSession(request);

  if (guard.response) {
    return guard.response;
  }

  const payload = (await request.json().catch(() => ({}))) as {
    address?: string;
    lat?: number;
    lng?: number;
  };

  try {
    if (typeof payload.lat === "number" && typeof payload.lng === "number") {
      const result = await reverseGeocodeCoordinates(payload.lat, payload.lng);

      return NextResponse.json({ ok: true, result });
    }

    if (!payload.address?.trim()) {
      return jsonError("Complete Address is required before checking delivery location.");
    }

    const result = await geocodeAddress(payload.address);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Delivery location lookup failed.", 502);
  }
}
