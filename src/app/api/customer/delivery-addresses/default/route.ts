import { NextResponse } from "next/server";
import {
  customerDeliveryAddressSelect,
  isMissingCustomerDeliveryAddressesTableError,
  mapCustomerDeliveryAddress,
  type CustomerDeliveryAddressRow,
} from "@/lib/customer-delivery-addresses";
import { createServerSupabaseClient, createSupabaseAdminClient } from "@/lib/supabase/server";

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

export async function GET(request: Request) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase server credentials are not configured.", 500);
  }

  const token = getBearerToken(request);

  if (!token) {
    return jsonError("Please login before loading delivery address.", 401);
  }

  const {
    data: { user },
    error: userError,
  } = await (createServerSupabaseClient() ?? admin).auth.getUser(token);

  if (userError || !user) {
    return jsonError("Your login session has expired. Please login again.", 401);
  }

  const { data: customer, error: customerError } = await admin
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (customerError) {
    return jsonError(customerError.message, 500);
  }

  if (!customer) {
    return jsonError("Customer profile was not found. Please register again.", 404);
  }

  const { data, error } = await admin
    .from("customer_delivery_addresses")
    .select(customerDeliveryAddressSelect)
    .eq("customer_id", (customer as { id: string }).id)
    .eq("is_default", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingCustomerDeliveryAddressesTableError(error)) {
      return NextResponse.json({ ok: true, address: null });
    }

    return jsonError(error.message, 500);
  }

  return NextResponse.json({
    ok: true,
    address: data ? mapCustomerDeliveryAddress(data as CustomerDeliveryAddressRow) : null,
  });
}
