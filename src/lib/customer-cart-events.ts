export const customerCartUpdatedEvent = "customer-cart-updated";

export function notifyCustomerCartUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(customerCartUpdatedEvent));
}
