import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

type OnlinePaymentRow = {
  id: string;
  order_id: string | null;
  payment_method: string | null;
  amount: number | string | null;
  reference_no: string | null;
  status: string | null;
  created_at: string | null;
};

type OrderRefRow = {
  id: string;
  order_no: string;
};

type PosPaymentRow = {
  id: string;
  sale_id: string;
  cashier_name_snapshot: string | null;
  payment_method: string;
  amount: number | string;
  reference_no: string | null;
  confirmed_at: string | null;
};

type PosSaleRefRow = {
  id: string;
  sale_no: string;
  customer_name_snapshot: string | null;
};

export type AdminPaymentListRecord = {
  id: string;
  source: "online_order" | "offline_pos";
  documentNo: string;
  customerName: string;
  method: string;
  amount: number;
  referenceNo: string;
  status: string;
  receivedBy: string;
  date: string;
  sortDate: string;
};

export type AdminPaymentsResult = {
  payments: AdminPaymentListRecord[];
  error?: string;
};

function toNumber(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function toDateLabel(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export async function getAdminPayments(): Promise<AdminPaymentsResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { payments: [], error: "Supabase admin client is not configured." };
  }

  const [onlinePaymentsResult, ordersResult, posPaymentsResult, posSalesResult] = await Promise.all([
    supabase.from("payment_records").select("id,order_id,payment_method,amount,reference_no,status,created_at").order("created_at", { ascending: false }),
    supabase.from("orders").select("id,order_no"),
    supabase.from("pos_payment_confirmations").select("id,sale_id,cashier_name_snapshot,payment_method,amount,reference_no,confirmed_at").order("confirmed_at", { ascending: false }),
    supabase.from("pos_sales").select("id,sale_no,customer_name_snapshot"),
  ]);

  if (onlinePaymentsResult.error) {
    return { payments: [], error: onlinePaymentsResult.error.message };
  }

  if (ordersResult.error) {
    return { payments: [], error: ordersResult.error.message };
  }

  if (posPaymentsResult.error) {
    return { payments: [], error: posPaymentsResult.error.message };
  }

  if (posSalesResult.error) {
    return { payments: [], error: posSalesResult.error.message };
  }

  const ordersById = new Map(((ordersResult.data ?? []) as OrderRefRow[]).map((order) => [order.id, order]));
  const salesById = new Map(((posSalesResult.data ?? []) as PosSaleRefRow[]).map((sale) => [sale.id, sale]));
  const onlinePayments = ((onlinePaymentsResult.data ?? []) as OnlinePaymentRow[]).map((payment): AdminPaymentListRecord => {
    const order = payment.order_id ? ordersById.get(payment.order_id) : undefined;
    const date = payment.created_at ?? "";

    return {
      id: payment.id,
      source: "online_order",
      documentNo: order?.order_no ?? "Online order",
      customerName: "-",
      method: payment.payment_method ?? "-",
      amount: toNumber(payment.amount),
      referenceNo: payment.reference_no ?? "-",
      status: payment.status ?? "pending",
      receivedBy: "Online payment record",
      date: toDateLabel(date),
      sortDate: date,
    };
  });
  const offlinePayments = ((posPaymentsResult.data ?? []) as PosPaymentRow[]).map((payment): AdminPaymentListRecord => {
    const sale = salesById.get(payment.sale_id);
    const date = payment.confirmed_at ?? "";

    return {
      id: payment.id,
      source: "offline_pos",
      documentNo: sale?.sale_no ?? "POS sale",
      customerName: sale?.customer_name_snapshot ?? "-",
      method: payment.payment_method,
      amount: toNumber(payment.amount),
      referenceNo: payment.reference_no ?? "-",
      status: "confirmed",
      receivedBy: payment.cashier_name_snapshot ?? "-",
      date: toDateLabel(date),
      sortDate: date,
    };
  });

  return {
    payments: [...onlinePayments, ...offlinePayments].sort((a, b) => b.sortDate.localeCompare(a.sortDate)),
  };
}

