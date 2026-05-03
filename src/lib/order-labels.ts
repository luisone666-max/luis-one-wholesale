export type ReceivingMethod = "pickup" | "local_delivery" | "courier_shipping" | "to_be_arranged";
export type ShippingFeePayment = "freight_collect" | "prepaid" | "to_be_confirmed" | "no_shipping_fee";

export const receivingMethodLabels: Record<ReceivingMethod, string> = {
  pickup: "Pick up at store",
  local_delivery: "Local delivery / Lalamove",
  courier_shipping: "Courier shipping",
  to_be_arranged: "To be arranged",
};

export const shippingFeePaymentLabels: Record<ShippingFeePayment, string> = {
  freight_collect: "Freight Collect / Paid by Receiver",
  prepaid: "Prepaid Shipping",
  to_be_confirmed: "To be Confirmed",
  no_shipping_fee: "Pick-up / No Shipping Fee",
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
  return receivingMethodLabels[value as ReceivingMethod] ?? value ?? "To be arranged";
}

export function getShippingFeePaymentLabel(value: string | null | undefined) {
  return shippingFeePaymentLabels[value as ShippingFeePayment] ?? value ?? "To be Confirmed";
}

export function getOrderStatusLabel(value: string | null | undefined) {
  return orderStatusLabels[value ?? ""] ?? value ?? "Pending Confirmation";
}

export function getPaymentStatusLabel(value: string | null | undefined) {
  return paymentStatusLabels[value ?? ""] ?? value ?? "No Payment";
}
