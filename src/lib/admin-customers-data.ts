import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  facebook_name: string | null;
  messenger_link: string | null;
  location: string | null;
  business_type: string | null;
  status: string | null;
  created_at: string | null;
  points_balance?: number | null;
  lifetime_points?: number | null;
};

type OrderRow = {
  id: string;
  customer_id: string | null;
  order_no?: string | null;
  product_total: number | string | null;
  order_status?: string | null;
  payment_status: string | null;
  receiver_name?: string | null;
  created_at?: string | null;
};

type PosSaleRow = {
  id: string;
  customer_id: string | null;
  sale_no?: string | null;
  salesperson_name_snapshot?: string | null;
  payment_method?: string | null;
  total_amount: number | string | null;
  status: string | null;
  cashier_confirmed_at?: string | null;
  created_at?: string | null;
};

type LoyaltyTransactionRow = {
  id: string;
  customer_id: string | null;
  source_type: string | null;
  source_id: string | null;
  points: number | string | null;
  amount: number | string | null;
  note: string | null;
  created_at: string | null;
};

export type AdminCustomerRecord = {
  id: string;
  name: string;
  phone: string;
  facebookMessenger: string;
  location: string;
  businessType: string;
  orderCount: number;
  totalSpend: number;
  pointsBalance: number | null;
  lifetimePoints: number | null;
  status: string;
  createdAt: string;
};

export type AdminCustomersResult = {
  customers: AdminCustomerRecord[];
  error?: string;
  pointsReady: boolean;
};

export type AdminCustomerOnlineOrderRecord = {
  id: string;
  orderNo: string;
  createdAt: string;
  receiverName: string;
  productTotal: number;
  orderStatus: string;
  paymentStatus: string;
};

export type AdminCustomerOfflineSaleRecord = {
  id: string;
  saleNo: string;
  createdAt: string;
  salespersonName: string;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  cashierConfirmedAt: string;
};

export type AdminCustomerLoyaltyRecord = {
  id: string;
  sourceType: string;
  sourceId: string;
  points: number;
  amount: number;
  note: string;
  createdAt: string;
};

export type AdminCustomerDetail = {
  customer: AdminCustomerRecord;
  summary: {
    onlineOrderCount: number;
    onlinePaidTotal: number;
    offlineSaleCount: number;
    offlinePaidTotal: number;
    totalPaid: number;
    lastActivityAt: string;
  };
  onlineOrders: AdminCustomerOnlineOrderRecord[];
  offlineSales: AdminCustomerOfflineSaleRecord[];
  loyaltyTransactions: AdminCustomerLoyaltyRecord[];
};

export type AdminCustomerDetailResult = {
  detail: AdminCustomerDetail | null;
  error?: string;
  pointsReady: boolean;
};

function toNumber(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function hasMissingPointsColumnError(message: string) {
  return message.includes("points_balance") || message.includes("lifetime_points");
}

function hasMissingLoyaltyTableError(message: string) {
  return message.includes("customer_loyalty_point_transactions") || message.includes("schema cache");
}

async function readCustomers() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { customers: [], pointsReady: false, error: "Supabase admin client is not configured." };
  }

  const withPoints = await supabase
    .from("customers")
    .select("id,name,phone,facebook_name,messenger_link,location,business_type,status,created_at,points_balance,lifetime_points")
    .order("created_at", { ascending: false });

  if (!withPoints.error) {
    return { customers: (withPoints.data ?? []) as CustomerRow[], pointsReady: true, supabase };
  }

  if (!hasMissingPointsColumnError(withPoints.error.message)) {
    return { customers: [], pointsReady: false, error: withPoints.error.message };
  }

  const withoutPoints = await supabase
    .from("customers")
    .select("id,name,phone,facebook_name,messenger_link,location,business_type,status,created_at")
    .order("created_at", { ascending: false });

  if (withoutPoints.error) {
    return { customers: [], pointsReady: false, error: withoutPoints.error.message };
  }

  return { customers: (withoutPoints.data ?? []) as CustomerRow[], pointsReady: false, supabase };
}

export async function getAdminCustomers(): Promise<AdminCustomersResult> {
  const customerResult = await readCustomers();

  if (!("supabase" in customerResult) || !customerResult.supabase) {
    return { customers: [], pointsReady: false, error: customerResult.error };
  }

  const { supabase, customers, pointsReady } = customerResult;
  const [ordersResult, posSalesResult] = await Promise.all([
    supabase.from("orders").select("id,customer_id,product_total,payment_status"),
    supabase.from("pos_sales").select("id,customer_id,total_amount,status"),
  ]);

  const orderStatsByCustomer = new Map<string, { count: number; spend: number }>();

  if (!ordersResult.error) {
    for (const order of (ordersResult.data ?? []) as OrderRow[]) {
      if (!order.customer_id) {
        continue;
      }

      const current = orderStatsByCustomer.get(order.customer_id) ?? { count: 0, spend: 0 };
      current.count += 1;

      if (order.payment_status === "fully_paid") {
        current.spend += toNumber(order.product_total);
      }

      orderStatsByCustomer.set(order.customer_id, current);
    }
  }

  if (!posSalesResult.error) {
    for (const sale of (posSalesResult.data ?? []) as PosSaleRow[]) {
      if (!sale.customer_id) {
        continue;
      }

      const current = orderStatsByCustomer.get(sale.customer_id) ?? { count: 0, spend: 0 };
      current.count += 1;

      if (sale.status === "paid") {
        current.spend += toNumber(sale.total_amount);
      }

      orderStatsByCustomer.set(sale.customer_id, current);
    }
  }

  return {
    pointsReady,
    error: ordersResult.error?.message ?? posSalesResult.error?.message,
    customers: customers.map((customer) => {
      const stats = orderStatsByCustomer.get(customer.id) ?? { count: 0, spend: 0 };

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone ?? "",
        facebookMessenger: customer.facebook_name || customer.messenger_link || "",
        location: customer.location ?? "",
        businessType: customer.business_type ?? "",
        orderCount: stats.count,
        totalSpend: stats.spend,
        pointsBalance: pointsReady ? toNumber(customer.points_balance) : null,
        lifetimePoints: pointsReady ? toNumber(customer.lifetime_points) : null,
        status: customer.status ?? "active",
        createdAt: customer.created_at ?? "",
      };
    }),
  };
}

export async function getAdminCustomerDetail(customerId: string): Promise<AdminCustomerDetailResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { detail: null, pointsReady: false, error: "Supabase admin client is not configured." };
  }

  const withPoints = await supabase
    .from("customers")
    .select("id,name,phone,facebook_name,messenger_link,location,business_type,status,created_at,points_balance,lifetime_points")
    .eq("id", customerId)
    .maybeSingle();

  let pointsReady = true;
  let customer = withPoints.data as CustomerRow | null;

  if (withPoints.error) {
    if (!hasMissingPointsColumnError(withPoints.error.message)) {
      return { detail: null, pointsReady: false, error: withPoints.error.message };
    }

    pointsReady = false;
    const withoutPoints = await supabase
      .from("customers")
      .select("id,name,phone,facebook_name,messenger_link,location,business_type,status,created_at")
      .eq("id", customerId)
      .maybeSingle();

    if (withoutPoints.error) {
      return { detail: null, pointsReady: false, error: withoutPoints.error.message };
    }

    customer = withoutPoints.data as CustomerRow | null;
  }

  if (!customer) {
    return { detail: null, pointsReady, error: "Customer was not found." };
  }

  const [ordersResult, posSalesResult, loyaltyResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id,customer_id,order_no,product_total,order_status,payment_status,receiver_name,created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("pos_sales")
      .select("id,customer_id,sale_no,salesperson_name_snapshot,payment_method,total_amount,status,cashier_confirmed_at,created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(50),
    pointsReady
      ? supabase
          .from("customer_loyalty_point_transactions")
          .select("id,customer_id,source_type,source_id,points,amount,note,created_at")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(80)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (ordersResult.error) {
    return { detail: null, pointsReady, error: ordersResult.error.message };
  }

  if (posSalesResult.error) {
    return { detail: null, pointsReady, error: posSalesResult.error.message };
  }

  if (loyaltyResult.error) {
    if (!hasMissingLoyaltyTableError(loyaltyResult.error.message)) {
      return { detail: null, pointsReady, error: loyaltyResult.error.message };
    }

    pointsReady = false;
  }

  const onlineOrders = ((ordersResult.data ?? []) as OrderRow[]).map((order) => ({
    id: order.id,
    orderNo: order.order_no ?? "",
    createdAt: order.created_at ?? "",
    receiverName: order.receiver_name ?? "",
    productTotal: toNumber(order.product_total),
    orderStatus: order.order_status ?? "pending_confirmation",
    paymentStatus: order.payment_status ?? "no_payment",
  }));
  const offlineSales = ((posSalesResult.data ?? []) as PosSaleRow[]).map((sale) => ({
    id: sale.id,
    saleNo: sale.sale_no ?? "",
    createdAt: sale.created_at ?? "",
    salespersonName: sale.salesperson_name_snapshot ?? "",
    paymentMethod: sale.payment_method ?? "",
    totalAmount: toNumber(sale.total_amount),
    status: sale.status ?? "waiting_cashier",
    cashierConfirmedAt: sale.cashier_confirmed_at ?? "",
  }));
  const loyaltyTransactions = (pointsReady ? ((loyaltyResult.data ?? []) as LoyaltyTransactionRow[]) : []).map((transaction) => ({
    id: transaction.id,
    sourceType: transaction.source_type ?? "",
    sourceId: transaction.source_id ?? "",
    points: toNumber(transaction.points),
    amount: toNumber(transaction.amount),
    note: transaction.note ?? "",
    createdAt: transaction.created_at ?? "",
  }));
  const onlinePaidTotal = onlineOrders
    .filter((order) => order.paymentStatus === "fully_paid")
    .reduce((sum, order) => sum + order.productTotal, 0);
  const offlinePaidTotal = offlineSales
    .filter((sale) => sale.status === "paid")
    .reduce((sum, sale) => sum + sale.totalAmount, 0);
  const lastActivityAt = [onlineOrders[0]?.createdAt, offlineSales[0]?.createdAt, loyaltyTransactions[0]?.createdAt]
    .filter(Boolean)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? customer.created_at ?? "";

  return {
    pointsReady,
    detail: {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone ?? "",
        facebookMessenger: customer.facebook_name || customer.messenger_link || "",
        location: customer.location ?? "",
        businessType: customer.business_type ?? "",
        orderCount: onlineOrders.length + offlineSales.length,
        totalSpend: onlinePaidTotal + offlinePaidTotal,
        pointsBalance: pointsReady ? toNumber(customer.points_balance) : null,
        lifetimePoints: pointsReady ? toNumber(customer.lifetime_points) : null,
        status: customer.status ?? "active",
        createdAt: customer.created_at ?? "",
      },
      summary: {
        onlineOrderCount: onlineOrders.length,
        onlinePaidTotal,
        offlineSaleCount: offlineSales.length,
        offlinePaidTotal,
        totalPaid: onlinePaidTotal + offlinePaidTotal,
        lastActivityAt,
      },
      onlineOrders,
      offlineSales,
      loyaltyTransactions,
    },
  };
}
