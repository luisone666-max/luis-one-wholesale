export const adminShipmentStatuses = [
  "draft",
  "ready_to_book",
  "booked",
  "in_transit",
  "delivered",
  "returning",
  "returned",
  "cancelled",
  "failed",
] as const;

export const adminCodStatuses = ["not_cod", "pending_collection", "collected", "remitted", "failed", "waived"] as const;

export const adminShipmentSelect =
  "id,order_id,provider,provider_service,booking_reference,tracking_no,waybill_no,label_url,shipment_status,cod_status,cod_amount,cod_currency,package_weight_grams,package_length_cm,package_width_cm,package_height_cm,sender_name,sender_phone,sender_address,receiver_name,receiver_phone,receiver_address,notes,last_tracked_at,created_at,updated_at";

export type AdminShipmentStatus = (typeof adminShipmentStatuses)[number];
export type AdminCodStatus = (typeof adminCodStatuses)[number];

export type AdminShipmentRow = {
  id: string;
  order_id: string | null;
  provider: string | null;
  provider_service: string | null;
  booking_reference: string | null;
  tracking_no: string | null;
  waybill_no: string | null;
  label_url: string | null;
  shipment_status: string | null;
  cod_status: string | null;
  cod_amount: number | string | null;
  cod_currency: string | null;
  package_weight_grams: number | string | null;
  package_length_cm: number | string | null;
  package_width_cm: number | string | null;
  package_height_cm: number | string | null;
  sender_name: string | null;
  sender_phone: string | null;
  sender_address: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  receiver_address: string | null;
  notes: string | null;
  last_tracked_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminShipmentRecord = {
  id: string;
  orderId: string;
  provider: string;
  providerService: string;
  bookingReference: string;
  trackingNo: string;
  waybillNo: string;
  labelUrl: string;
  status: string;
  codStatus: string;
  codAmount: number | null;
  codCurrency: string;
  packageWeightGrams: number | null;
  packageLengthCm: number | null;
  packageWidthCm: number | null;
  packageHeightCm: number | null;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  notes: string;
  lastTrackedAt: string;
  createdAt: string;
  createdDate: string;
  updatedAt: string;
};

function numberOrNull(value: number | string | null) {
  if (value === null || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
}

export function isMissingOrderShipmentsTableError(error: { code?: string; message?: string; details?: string }) {
  const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

  return (
    error.code === "42P01" ||
    (message.includes("order_shipments") && (message.includes("schema cache") || message.includes("could not find")))
  );
}

export function normalizeShipmentStatus(value: string | null | undefined): AdminShipmentStatus {
  return adminShipmentStatuses.includes(value as AdminShipmentStatus) ? (value as AdminShipmentStatus) : "draft";
}

export function normalizeCodStatus(value: string | null | undefined): AdminCodStatus {
  return adminCodStatuses.includes(value as AdminCodStatus) ? (value as AdminCodStatus) : "pending_collection";
}

export function mapAdminShipment(row: AdminShipmentRow): AdminShipmentRecord {
  return {
    id: row.id,
    orderId: row.order_id ?? "",
    provider: row.provider ?? "jnt",
    providerService: row.provider_service ?? "cod",
    bookingReference: row.booking_reference ?? "",
    trackingNo: row.tracking_no ?? "",
    waybillNo: row.waybill_no ?? "",
    labelUrl: row.label_url ?? "",
    status: normalizeShipmentStatus(row.shipment_status),
    codStatus: normalizeCodStatus(row.cod_status),
    codAmount: numberOrNull(row.cod_amount),
    codCurrency: row.cod_currency ?? "PHP",
    packageWeightGrams: numberOrNull(row.package_weight_grams),
    packageLengthCm: numberOrNull(row.package_length_cm),
    packageWidthCm: numberOrNull(row.package_width_cm),
    packageHeightCm: numberOrNull(row.package_height_cm),
    senderName: row.sender_name ?? "",
    senderPhone: row.sender_phone ?? "",
    senderAddress: row.sender_address ?? "",
    receiverName: row.receiver_name ?? "",
    receiverPhone: row.receiver_phone ?? "",
    receiverAddress: row.receiver_address ?? "",
    notes: row.notes ?? "",
    lastTrackedAt: row.last_tracked_at ?? "",
    createdAt: row.created_at ?? "",
    createdDate: formatDate(row.created_at),
    updatedAt: row.updated_at ?? "",
  };
}
