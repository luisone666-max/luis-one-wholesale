"use client";

import { getCurrentCustomerSession } from "@/lib/customer-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type OrderRow = {
  id: string;
  order_no: string;
  product_total: number | string | null;
  order_status: string | null;
  payment_status: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  receiving_method: string | null;
  complete_address: string | null;
  shipping_fee_payment_method: string | null;
  shipping_fee_amount: number | string | null;
  shipping_fee_status: string | null;
  order_notes: string | null;
  created_at: string | null;
};

type OrderItemRow = {
  id: string;
  product_id: string | null;
  product_name_snapshot: string | null;
  sku_snapshot: string | null;
  quantity: number;
  unit_price_snapshot: number | string;
  subtotal: number | string;
};

export type CustomerOrderSummary = {
  id: string;
  orderNo: string;
  date: string;
  productTotal: number;
  orderStatus: string;
  paymentStatus: string;
  receivingMethod: string | null;
};

export type CustomerOrderDetail = CustomerOrderSummary & {
  receiverName: string | null;
  receiverPhone: string | null;
  completeAddress: string | null;
  shippingFeePayment: string | null;
  shippingFeeAmount: number | null;
  shippingFeeStatus: string | null;
  orderNotes: string | null;
  items: {
    id: string;
    productId: string | null;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
};

async function getOrderContext() {
  const supabase = createBrowserSupabaseClient();

  if (!supabase) {
    return { error: "Supabase is not configured yet." as const };
  }

  const session = await getCurrentCustomerSession();

  if (!session.user || !session.customer) {
    return { error: "Please login or register to view orders." as const };
  }

  return { supabase };
}

function toDateLabel(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
}

function mapOrderSummary(row: OrderRow): CustomerOrderSummary {
  return {
    id: row.id,
    orderNo: row.order_no,
    date: toDateLabel(row.created_at),
    productTotal: Number(row.product_total ?? 0),
    orderStatus: row.order_status ?? "pending_confirmation",
    paymentStatus: row.payment_status ?? "no_payment",
    receivingMethod: row.receiving_method,
  };
}

export async function getCustomerOrders(): Promise<{ orders: CustomerOrderSummary[]; error?: string }> {
  const context = await getOrderContext();

  if ("error" in context) {
    return { orders: [], error: context.error };
  }

  const { data, error } = await context.supabase
    .from("orders")
    .select("id,order_no,product_total,order_status,payment_status,receiving_method,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return { orders: [], error: error.message };
  }

  return { orders: ((data ?? []) as OrderRow[]).map(mapOrderSummary) };
}

export async function getCustomerOrderDetail(orderNo: string): Promise<{ order: CustomerOrderDetail | null; error?: string }> {
  const context = await getOrderContext();

  if ("error" in context) {
    return { order: null, error: context.error };
  }

  const { data: orderData, error: orderError } = await context.supabase
    .from("orders")
    .select(
      "id,order_no,product_total,order_status,payment_status,receiver_name,receiver_phone,receiving_method,complete_address,shipping_fee_payment_method,shipping_fee_amount,shipping_fee_status,order_notes,created_at",
    )
    .eq("order_no", orderNo)
    .maybeSingle();

  if (orderError) {
    return { order: null, error: orderError.message };
  }

  if (!orderData) {
    return { order: null, error: "Order was not found." };
  }

  const orderRow = orderData as OrderRow;
  const { data: itemData, error: itemError } = await context.supabase
    .from("order_items")
    .select("id,product_id,product_name_snapshot,sku_snapshot,quantity,unit_price_snapshot,subtotal")
    .eq("order_id", orderRow.id)
    .order("id", { ascending: true });

  if (itemError) {
    return { order: null, error: itemError.message };
  }

  return {
    order: {
      ...mapOrderSummary(orderRow),
      receiverName: orderRow.receiver_name,
      receiverPhone: orderRow.receiver_phone,
      completeAddress: orderRow.complete_address,
      shippingFeePayment: orderRow.shipping_fee_payment_method,
      shippingFeeAmount: orderRow.shipping_fee_amount === null ? null : Number(orderRow.shipping_fee_amount),
      shippingFeeStatus: orderRow.shipping_fee_status,
      orderNotes: orderRow.order_notes,
      items: ((itemData ?? []) as OrderItemRow[]).map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name_snapshot ?? "Wholesale item",
        sku: item.sku_snapshot ?? "",
        quantity: item.quantity,
        unitPrice: Number(item.unit_price_snapshot),
        subtotal: Number(item.subtotal),
      })),
    },
  };
}
