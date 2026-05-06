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
  product_total: number | string | null;
  payment_status: string | null;
};

type PosSaleRow = {
  id: string;
  customer_id: string | null;
  total_amount: number | string | null;
  status: string | null;
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

function toNumber(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function hasMissingPointsColumnError(message: string) {
  return message.includes("points_balance") || message.includes("lifetime_points");
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

