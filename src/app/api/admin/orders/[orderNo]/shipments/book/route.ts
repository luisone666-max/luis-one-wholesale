import { NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/admin-audit-log";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import {
  adminShipmentSelect,
  isMissingOrderShipmentsTableError,
  mapAdminShipment,
  type AdminShipmentRow,
} from "@/lib/admin-shipments-data";
import { bookJntCodShipment } from "@/lib/jnt-logistics";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}

function migrationRequired() {
  return jsonError("Order shipments table is not ready. Run the latest Supabase migration first.", 409);
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function validateShipment(shipment: AdminShipmentRow) {
  const missing = [
    shipment.receiver_name ? "" : "receiver name",
    shipment.receiver_phone ? "" : "receiver phone",
    shipment.receiver_address ? "" : "receiver address",
    numberOrNull(shipment.cod_amount) === null ? "COD amount" : "",
    numberOrNull(shipment.package_weight_grams) ? "" : "package weight",
    numberOrNull(shipment.package_length_cm) ? "" : "package length",
    numberOrNull(shipment.package_width_cm) ? "" : "package width",
    numberOrNull(shipment.package_height_cm) ? "" : "package height",
  ].filter(Boolean);

  return missing;
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
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const shipmentId = cleanString(payload.shipmentId);

  if (!shipmentId) {
    return jsonError("Save the J&T Express COD draft before booking.", 409);
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id,order_no")
    .eq("order_no", orderNo)
    .maybeSingle();

  if (orderError) {
    return jsonError(orderError.message, 500);
  }

  if (!order) {
    return jsonError("Order was not found.", 404);
  }

  const orderRow = order as { id: string; order_no: string };
  const { data: shipmentData, error: shipmentError } = await admin
    .from("order_shipments")
    .select(adminShipmentSelect)
    .eq("id", shipmentId)
    .eq("order_id", orderRow.id)
    .maybeSingle();

  if (shipmentError) {
    return isMissingOrderShipmentsTableError(shipmentError) ? migrationRequired() : jsonError(shipmentError.message, 500);
  }

  if (!shipmentData) {
    return jsonError("Shipment draft was not found.", 404);
  }

  const shipment = shipmentData as AdminShipmentRow;
  const missing = validateShipment(shipment);

  if (missing.length) {
    const { data: updatedShipment } = await admin
      .from("order_shipments")
      .update({
        shipment_status: "ready_to_book",
        api_response: { ok: false, code: "validation_error", missing },
        updated_by_admin_user_id: guard.admin.id,
      })
      .eq("id", shipment.id)
      .select(adminShipmentSelect)
      .single();

    return jsonError(`Complete shipment details first: ${missing.join(", ")}.`, 409, {
      shipment: updatedShipment ? mapAdminShipment(updatedShipment as AdminShipmentRow) : mapAdminShipment(shipment),
    });
  }

  const bookingResult = await bookJntCodShipment({
    orderNo: orderRow.order_no,
    receiverName: shipment.receiver_name ?? "",
    receiverPhone: shipment.receiver_phone ?? "",
    receiverAddress: shipment.receiver_address ?? "",
    codAmount: numberOrNull(shipment.cod_amount),
    codCurrency: shipment.cod_currency ?? "PHP",
    packageWeightGrams: numberOrNull(shipment.package_weight_grams),
    packageLengthCm: numberOrNull(shipment.package_length_cm),
    packageWidthCm: numberOrNull(shipment.package_width_cm),
    packageHeightCm: numberOrNull(shipment.package_height_cm),
    notes: shipment.notes ?? "",
    senderName: shipment.sender_name ?? undefined,
    senderPhone: shipment.sender_phone ?? undefined,
    senderAddress: shipment.sender_address ?? undefined,
  });
  const nextStatus = bookingResult.ok ? "booked" : bookingResult.code === "api_error" ? "failed" : "ready_to_book";
  const { data: updatedShipment, error: updateError } = await admin
    .from("order_shipments")
    .update({
      booking_reference: bookingResult.bookingReference ?? shipment.booking_reference,
      tracking_no: bookingResult.trackingNo ?? shipment.tracking_no,
      waybill_no: bookingResult.waybillNo ?? shipment.waybill_no,
      label_url: bookingResult.labelUrl ?? shipment.label_url,
      shipment_status: nextStatus,
      api_request: bookingResult.rawRequest,
      api_response: bookingResult.rawResponse,
      updated_by_admin_user_id: guard.admin.id,
    })
    .eq("id", shipment.id)
    .select(adminShipmentSelect)
    .single();

  if (updateError || !updatedShipment) {
    return updateError && isMissingOrderShipmentsTableError(updateError)
      ? migrationRequired()
      : jsonError(updateError?.message ?? "Shipment booking update failed.", 500);
  }

  const mappedShipment = mapAdminShipment(updatedShipment as AdminShipmentRow);

  await writeAdminAuditLog({
    supabase: admin,
    admin: guard.admin,
    action: bookingResult.ok ? "online_order_shipment_booked" : "online_order_shipment_booking_attempted",
    entityType: "online_order_shipment",
    entityId: mappedShipment.id,
    entityLabel: `${orderRow.order_no} / J&T`,
    previousData: shipment,
    newData: updatedShipment,
    metadata: {
      order_id: orderRow.id,
      order_no: orderRow.order_no,
      booking_code: bookingResult.code,
    },
  });

  if (!bookingResult.ok) {
    return jsonError(bookingResult.message, bookingResult.code === "api_error" ? 502 : 409, {
      shipment: mappedShipment,
      booking: {
        code: bookingResult.code,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    message: bookingResult.message,
    shipment: mappedShipment,
  });
}
