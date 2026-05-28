import { NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/admin-audit-log";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import {
  adminCodStatuses,
  adminShipmentSelect,
  adminShipmentStatuses,
  isMissingOrderShipmentsTableError,
  mapAdminShipment,
  type AdminCodStatus,
  type AdminShipmentRow,
  type AdminShipmentStatus,
} from "@/lib/admin-shipments-data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function migrationRequired() {
  return jsonError("Order shipments table is not ready. Run the latest Supabase migration first.", 409);
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readOptionalNumber(payload: Record<string, unknown>, key: string, label: string) {
  if (!(key in payload) || payload[key] === null || payload[key] === "") {
    return { value: null, error: "" };
  }

  const value = Number(payload[key]);

  if (!Number.isFinite(value) || value < 0) {
    return { value: null, error: `${label} must be 0 or higher.` };
  }

  return { value, error: "" };
}

function readShipmentStatus(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return { value: "draft" as AdminShipmentStatus, error: "" };
  }

  if (!adminShipmentStatuses.includes(value as AdminShipmentStatus)) {
    return { value: "draft" as AdminShipmentStatus, error: "Invalid shipment status." };
  }

  return { value: value as AdminShipmentStatus, error: "" };
}

function readCodStatus(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return { value: "pending_collection" as AdminCodStatus, error: "" };
  }

  if (!adminCodStatuses.includes(value as AdminCodStatus)) {
    return { value: "pending_collection" as AdminCodStatus, error: "Invalid COD status." };
  }

  return { value: value as AdminCodStatus, error: "" };
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
  const shipmentId = cleanString(payload.id);

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id,order_no,product_total,receiver_name,receiver_phone,complete_address")
    .eq("order_no", orderNo)
    .maybeSingle();

  if (orderError) {
    return jsonError(orderError.message, 500);
  }

  if (!order) {
    return jsonError("Order was not found.", 404);
  }

  const orderRow = order as {
    id: string;
    order_no: string;
    product_total: number | string | null;
    receiver_name: string | null;
    receiver_phone: string | null;
    complete_address: string | null;
  };
  const shipmentStatus = readShipmentStatus(payload.status);
  const codStatus = readCodStatus(payload.codStatus);
  const codAmount = readOptionalNumber(payload, "codAmount", "COD amount");
  const packageWeight = readOptionalNumber(payload, "packageWeightGrams", "Package weight");
  const packageLength = readOptionalNumber(payload, "packageLengthCm", "Package length");
  const packageWidth = readOptionalNumber(payload, "packageWidthCm", "Package width");
  const packageHeight = readOptionalNumber(payload, "packageHeightCm", "Package height");
  const numberErrors = [
    shipmentStatus.error,
    codStatus.error,
    codAmount.error,
    packageWeight.error,
    packageLength.error,
    packageWidth.error,
    packageHeight.error,
  ].filter(Boolean);

  if (numberErrors.length) {
    return jsonError(numberErrors[0]);
  }

  const provider = cleanString(payload.provider) ?? "jnt";
  const providerService = cleanString(payload.providerService) ?? "cod";
  const codCurrency = cleanString(payload.codCurrency) ?? "PHP";
  const receiverName = cleanString(payload.receiverName) ?? orderRow.receiver_name;
  const receiverPhone = cleanString(payload.receiverPhone) ?? orderRow.receiver_phone;
  const receiverAddress = cleanString(payload.receiverAddress) ?? orderRow.complete_address;
  const shipmentData = {
    provider,
    provider_service: providerService,
    booking_reference: cleanString(payload.bookingReference),
    tracking_no: cleanString(payload.trackingNo),
    waybill_no: cleanString(payload.waybillNo),
    label_url: cleanString(payload.labelUrl),
    shipment_status: shipmentStatus.value,
    cod_status: codStatus.value,
    cod_amount: codAmount.value,
    cod_currency: codCurrency,
    package_weight_grams: packageWeight.value,
    package_length_cm: packageLength.value,
    package_width_cm: packageWidth.value,
    package_height_cm: packageHeight.value,
    sender_name: cleanString(payload.senderName),
    sender_phone: cleanString(payload.senderPhone),
    sender_address: cleanString(payload.senderAddress),
    receiver_name: receiverName,
    receiver_phone: receiverPhone,
    receiver_address: receiverAddress,
    notes: cleanString(payload.notes),
    updated_by_admin_user_id: guard.admin.id,
  };

  let previousData: AdminShipmentRow | null = null;
  let result:
    | {
        data: unknown;
        error: { code?: string; message?: string; details?: string } | null;
      }
    | null = null;

  if (shipmentId) {
    const { data: existingShipment, error: existingShipmentError } = await admin
      .from("order_shipments")
      .select(adminShipmentSelect)
      .eq("id", shipmentId)
      .eq("order_id", orderRow.id)
      .maybeSingle();

    if (existingShipmentError) {
      return isMissingOrderShipmentsTableError(existingShipmentError) ? migrationRequired() : jsonError(existingShipmentError.message, 500);
    }

    if (!existingShipment) {
      return jsonError("Shipment was not found.", 404);
    }

    previousData = existingShipment as AdminShipmentRow;
    result = await admin
      .from("order_shipments")
      .update(shipmentData)
      .eq("id", shipmentId)
      .eq("order_id", orderRow.id)
      .select(adminShipmentSelect)
      .single();
  } else {
    const defaultCodAmount =
      codAmount.value === null && codStatus.value !== "not_cod" ? Number(orderRow.product_total ?? 0) : codAmount.value;

    result = await admin
      .from("order_shipments")
      .insert({
        ...shipmentData,
        order_id: orderRow.id,
        cod_amount: defaultCodAmount,
        created_by_admin_user_id: guard.admin.id,
      })
      .select(adminShipmentSelect)
      .single();
  }

  if (!result || result.error || !result.data) {
    const error = result?.error;
    return error && isMissingOrderShipmentsTableError(error) ? migrationRequired() : jsonError(error?.message ?? "Shipment save failed.", 500);
  }

  const row = result.data as AdminShipmentRow;

  await writeAdminAuditLog({
    supabase: admin,
    admin: guard.admin,
    action: shipmentId ? "online_order_shipment_updated" : "online_order_shipment_created",
    entityType: "online_order_shipment",
    entityId: row.id,
    entityLabel: `${orderRow.order_no} / ${row.provider ?? "jnt"}`,
    previousData,
    newData: row,
    metadata: {
      order_id: orderRow.id,
      order_no: orderRow.order_no,
    },
  });

  return NextResponse.json({
    ok: true,
    shipment: mapAdminShipment(row),
  });
}
