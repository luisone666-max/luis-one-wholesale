import { buildCompleteDeliveryAddress, type CheckoutAddressDraft } from "@/lib/philippines-addresses";

export const customerDeliveryAddressSelect =
  "id,customer_id,label,receiver_name,receiver_phone,delivery_province,delivery_city,delivery_barangay,delivery_street_address,delivery_landmark,delivery_notes,complete_address,latitude,longitude,geolocation_accuracy_m,is_default,created_at,updated_at";

export type CustomerDeliveryAddressRow = {
  id: string;
  customer_id: string;
  label: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  delivery_province: string | null;
  delivery_city: string | null;
  delivery_barangay: string | null;
  delivery_street_address: string | null;
  delivery_landmark: string | null;
  delivery_notes: string | null;
  complete_address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  geolocation_accuracy_m: number | string | null;
  is_default: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CustomerDeliveryAddressRecord = {
  id: string;
  label: string;
  receiverName: string;
  receiverPhone: string;
  address: CheckoutAddressDraft;
  completeAddress: string;
  latitude: number | null;
  longitude: number | null;
  geolocationAccuracyM: number | null;
  isDefault: boolean;
};

function numberOrNull(value: number | string | null) {
  if (value === null || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function isMissingCustomerDeliveryAddressesTableError(error: { code?: string; message?: string; details?: string }) {
  const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

  return (
    error.code === "42P01" ||
    (message.includes("customer_delivery_addresses") && (message.includes("schema cache") || message.includes("could not find")))
  );
}

export function mapCustomerDeliveryAddress(row: CustomerDeliveryAddressRow): CustomerDeliveryAddressRecord {
  const address = {
    landmark: row.delivery_landmark ?? "",
    streetAddress: row.delivery_street_address ?? "",
    barangay: row.delivery_barangay ?? "",
    city: row.delivery_city ?? "",
    province: row.delivery_province ?? "",
    notes: row.delivery_notes ?? "",
  };

  return {
    id: row.id,
    label: row.label ?? "Default delivery address",
    receiverName: row.receiver_name ?? "",
    receiverPhone: row.receiver_phone ?? "",
    address,
    completeAddress: row.complete_address || buildCompleteDeliveryAddress(address),
    latitude: numberOrNull(row.latitude),
    longitude: numberOrNull(row.longitude),
    geolocationAccuracyM: numberOrNull(row.geolocation_accuracy_m),
    isDefault: row.is_default ?? false,
  };
}
