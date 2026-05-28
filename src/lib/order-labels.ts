export type ReceivingMethod = "pickup" | "local_delivery" | "courier_shipping" | "to_be_arranged";
export type ShippingFeePayment = "freight_collect" | "prepaid" | "cod_included" | "to_be_confirmed" | "no_shipping_fee";

export const receivingMethodLabels: Record<ReceivingMethod, string> = {
  pickup: "Store Pickup",
  local_delivery: "Lalamove",
  courier_shipping: "J&T Express COD",
  to_be_arranged: "Legacy / To be arranged",
};

export const shippingFeePaymentLabels: Record<ShippingFeePayment, string> = {
  freight_collect: "Paid to Rider / Receiver",
  prepaid: "Prepaid Shipping",
  cod_included: "J&T Express COD / Included in Total",
  to_be_confirmed: "To be Confirmed",
  no_shipping_fee: "Store Pickup / No Shipping Fee",
};

export const orderStatusLabels: Record<string, string> = {
  pending_confirmation: "Pending Confirmation",
  waiting_for_deposit: "Waiting for Deposit",
  deposit_paid: "Deposit Paid",
  sourcing_items: "Sourcing Items",
  ready_for_pickup: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
  unavailable_refund: "Unavailable / Refund",
};

export const paymentStatusLabels: Record<string, string> = {
  no_payment: "No Payment",
  deposit_submitted: "Deposit Submitted",
  deposit_verified: "Deposit Verified",
  fully_paid: "Fully Paid",
  rejected: "Rejected",
};

export function getReceivingMethodLabel(value: string | null | undefined) {
  if (value === "local_delivery_lalamove") {
    return receivingMethodLabels.local_delivery;
  }

  if (value === "pick_up_at_store") {
    return receivingMethodLabels.pickup;
  }

  return receivingMethodLabels[value as ReceivingMethod] ?? value ?? "To be arranged";
}

export function getShippingFeePaymentLabel(value: string | null | undefined) {
  if (value === "pickup_no_shipping_fee") {
    return shippingFeePaymentLabels.no_shipping_fee;
  }

  return shippingFeePaymentLabels[value as ShippingFeePayment] ?? value ?? "To be Confirmed";
}

export function getOrderStatusLabel(value: string | null | undefined) {
  return orderStatusLabels[value ?? ""] ?? value ?? "Pending Confirmation";
}

export function getPaymentStatusLabel(value: string | null | undefined) {
  return paymentStatusLabels[value ?? ""] ?? value ?? "No Payment";
}
