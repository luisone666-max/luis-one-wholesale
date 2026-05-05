import { NextResponse } from "next/server";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { getLalamoveConfigStatus, getLalamoveQuotation } from "@/lib/lalamove";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function GET(request: Request) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  return NextResponse.json({ ok: true, config: getLalamoveConfigStatus() });
}

export async function POST(request: Request, { params }: { params: Promise<{ orderNo: string }> }) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const { orderNo } = await params;
  const payload = (await request.json().catch(() => ({}))) as {
    serviceType?: string;
    dropoffLat?: string;
    dropoffLng?: string;
    dropoffAddress?: string;
  };
  const { data: order, error } = await admin
    .from("orders")
    .select("order_no,complete_address,receiver_name,receiver_phone")
    .eq("order_no", orderNo)
    .maybeSingle();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!order) {
    return jsonError("Order not found.", 404);
  }

  if (!payload.dropoffLat?.trim() || !payload.dropoffLng?.trim()) {
    return jsonError("Drop-off latitude and longitude are required for Lalamove quotation.");
  }

  const dropoffAddress = payload.dropoffAddress?.trim() || order.complete_address || "";

  if (!dropoffAddress) {
    return jsonError("Drop-off address is required.");
  }

  try {
    const quote = await getLalamoveQuotation({
      serviceType: payload.serviceType?.trim(),
      dropoffAddress,
      dropoffLat: payload.dropoffLat,
      dropoffLng: payload.dropoffLng,
    });

    return NextResponse.json({
      ok: true,
      quote,
      note: "Quotation is for admin review only. Final delivery fee should still be confirmed manually.",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Lalamove quotation failed.", 502);
  }
}
