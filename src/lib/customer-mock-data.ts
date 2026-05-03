export type CustomerTier = {
  label: string;
  min: number;
  max: number | null;
  price: number;
};

export type CustomerCartItem = {
  sku: string;
  slug: string;
  name: string;
  image: string;
  quantity: number;
  tiers: CustomerTier[];
};

export const wholesaleTiers: CustomerTier[] = [
  { label: "1-5 pcs", min: 1, max: 5, price: 135 },
  { label: "6-11 pcs", min: 6, max: 11, price: 125 },
  { label: "12-49 pcs", min: 12, max: 49, price: 118 },
  { label: "50+ pcs", min: 50, max: null, price: 110 },
];

export const customerCartItems: CustomerCartItem[] = [
  {
    sku: "WH-MP-1001",
    slug: "flat-seat-click-125-150-160",
    name: "Flat Seat Click 125 / 150 / 160",
    image: "/products/flat-seat-click.svg",
    quantity: 6,
    tiers: wholesaleTiers,
  },
  {
    sku: "WH-MP-1002",
    slug: "ignition-keyset-mio-click",
    name: "Ignition Keyset Mio / Click",
    image: "/products/ignition-keyset.svg",
    quantity: 12,
    tiers: wholesaleTiers,
  },
  {
    sku: "WH-AC-1004",
    slug: "contact-cleaner-spray-450ml",
    name: "Contact Cleaner Spray 450ml",
    image: "/products/contact-cleaner.svg",
    quantity: 50,
    tiers: wholesaleTiers,
  },
];

export const customerOrders = [
  {
    orderNo: "LO-2026-000001",
    date: "2026-05-03",
    productTotal: "PHP 3,500",
    orderStatus: "Waiting for Deposit",
    paymentStatus: "No Payment",
    receivingMethod: "Courier shipping",
  },
  {
    orderNo: "LO-2026-000002",
    date: "2026-05-02",
    productTotal: "PHP 1,734",
    orderStatus: "Deposit Paid",
    paymentStatus: "Deposit Verified",
    receivingMethod: "Pick up at store",
  },
  {
    orderNo: "LO-2026-000003",
    date: "2026-05-01",
    productTotal: "PHP 5,880",
    orderStatus: "Sourcing Items",
    paymentStatus: "Deposit Submitted",
    receivingMethod: "Local delivery / Lalamove",
  },
];

export function getTierForCustomerQuantity(item: CustomerCartItem, quantity: number) {
  return item.tiers.find((tier) => quantity >= tier.min && (tier.max === null || quantity <= tier.max)) ?? item.tiers[0];
}

export function formatPhp(value: number) {
  return `PHP ${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
