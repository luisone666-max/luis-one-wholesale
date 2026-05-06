import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

type PosSaleRow = {
  id: string;
  sale_no: string;
  salesperson_admin_user_id: string | null;
  salesperson_employee_no: string | null;
  salesperson_name_snapshot: string | null;
  customer_id: string | null;
  customer_name_snapshot: string | null;
  customer_phone_snapshot: string | null;
  customer_is_member: boolean | null;
  payment_method: string;
  product_total: number | string;
  discount_amount: number | string;
  total_amount: number | string;
  status: string;
  price_change_notes: string | null;
  sale_notes: string | null;
  cashier_admin_user_id: string | null;
  cashier_name_snapshot: string | null;
  cashier_confirmed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type PosSaleItemRow = {
  id: string;
  sale_id: string;
  product_id: string | null;
  variant_id: string | null;
  item_name_snapshot: string;
  sku_snapshot: string | null;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
  notes: string | null;
};

export type PosSaleItemRecord = {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string;
};

export type PosSaleRecord = {
  id: string;
  saleNo: string;
  salespersonAdminUserId: string;
  salespersonEmployeeNo: string;
  salespersonName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerIsMember: boolean;
  paymentMethod: string;
  productTotal: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  priceChangeNotes: string;
  saleNotes: string;
  cashierName: string;
  cashierConfirmedAt: string;
  createdAt: string;
  items: PosSaleItemRecord[];
};

export type PosSalesResult = {
  sales: PosSaleRecord[];
  error?: string;
};

export type PosSalesSummary = {
  todayTotal: number;
  monthTotal: number;
  waitingTotal: number;
  waitingCount: number;
  paidTotal: number;
  paidCount: number;
};

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function mapSale(row: PosSaleRow, items: PosSaleItemRow[]): PosSaleRecord {
  return {
    id: row.id,
    saleNo: row.sale_no,
    salespersonAdminUserId: row.salesperson_admin_user_id ?? "",
    salespersonEmployeeNo: row.salesperson_employee_no ?? "",
    salespersonName: row.salesperson_name_snapshot ?? "",
    customerId: row.customer_id ?? "",
    customerName: row.customer_name_snapshot ?? "",
    customerPhone: row.customer_phone_snapshot ?? "",
    customerIsMember: row.customer_is_member ?? false,
    paymentMethod: row.payment_method,
    productTotal: toNumber(row.product_total),
    discountAmount: toNumber(row.discount_amount),
    totalAmount: toNumber(row.total_amount),
    status: row.status,
    priceChangeNotes: row.price_change_notes ?? "",
    saleNotes: row.sale_notes ?? "",
    cashierName: row.cashier_name_snapshot ?? "",
    cashierConfirmedAt: row.cashier_confirmed_at ?? "",
    createdAt: row.created_at ?? "",
    items: items.map((item) => ({
      id: item.id,
      productId: item.product_id ?? "",
      variantId: item.variant_id ?? "",
      name: item.item_name_snapshot,
      sku: item.sku_snapshot ?? "",
      quantity: item.quantity,
      unitPrice: toNumber(item.unit_price),
      subtotal: toNumber(item.subtotal),
      notes: item.notes ?? "",
    })),
  };
}

export async function getPosSales(
  status?: string,
  options: { salespersonAdminUserId?: string; limit?: number } = {},
): Promise<PosSalesResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { sales: [], error: "Supabase admin client is not configured." };
  }

  let query = supabase
    .from("pos_sales")
    .select(
      "id,sale_no,salesperson_admin_user_id,salesperson_employee_no,salesperson_name_snapshot,customer_id,customer_name_snapshot,customer_phone_snapshot,customer_is_member,payment_method,product_total,discount_amount,total_amount,status,price_change_notes,sale_notes,cashier_admin_user_id,cashier_name_snapshot,cashier_confirmed_at,created_at,updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 80);

  if (status) {
    query = query.eq("status", status);
  }

  if (options.salespersonAdminUserId) {
    query = query.eq("salesperson_admin_user_id", options.salespersonAdminUserId);
  }

  const { data: saleRows, error: salesError } = await query;

  if (salesError) {
    return { sales: [], error: salesError.message };
  }

  const sales = (saleRows ?? []) as PosSaleRow[];
  const saleIds = sales.map((sale) => sale.id);
  const { data: itemRows, error: itemsError } = saleIds.length
    ? await supabase
        .from("pos_sale_items")
        .select("id,sale_id,product_id,variant_id,item_name_snapshot,sku_snapshot,quantity,unit_price,subtotal,notes")
        .in("sale_id", saleIds)
    : { data: [], error: null };

  if (itemsError) {
    return { sales: [], error: itemsError.message };
  }

  const itemsBySaleId = new Map<string, PosSaleItemRow[]>();

  for (const item of (itemRows ?? []) as PosSaleItemRow[]) {
    itemsBySaleId.set(item.sale_id, [...(itemsBySaleId.get(item.sale_id) ?? []), item]);
  }

  return { sales: sales.map((sale) => mapSale(sale, itemsBySaleId.get(sale.id) ?? [])) };
}

export async function getPosSalesSummary(salespersonAdminUserId?: string): Promise<{ summary: PosSalesSummary; error?: string }> {
  const supabase = createSupabaseAdminClient();
  const emptySummary = { todayTotal: 0, monthTotal: 0, waitingTotal: 0, waitingCount: 0, paidTotal: 0, paidCount: 0 };

  if (!supabase) {
    return { summary: emptySummary, error: "Supabase admin client is not configured." };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  let query = supabase.from("pos_sales").select("total_amount,status,created_at").gte("created_at", monthStart);

  if (salespersonAdminUserId) {
    query = query.eq("salesperson_admin_user_id", salespersonAdminUserId);
  }

  const { data, error } = await query;

  if (error) {
    return { summary: emptySummary, error: error.message };
  }

  const summary = { ...emptySummary };

  for (const sale of (data ?? []) as Array<{ total_amount: number | string | null; status: string | null; created_at: string | null }>) {
    const amount = Number(sale.total_amount ?? 0);
    const createdAt = sale.created_at ?? "";

    if (sale.status === "waiting_cashier") {
      summary.waitingCount += 1;
      summary.waitingTotal += amount;
    }

    if (sale.status === "paid") {
      summary.paidCount += 1;
      summary.paidTotal += amount;
      summary.monthTotal += amount;

      if (createdAt >= todayStart) {
        summary.todayTotal += amount;
      }
    }
  }

  return { summary };
}

export async function getPosCatalogData() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { staffUsers: [], customers: [], products: [], error: "Supabase admin client is not configured." };
  }

  const [staffResult, customersResult, productsResult] = await Promise.all([
    supabase.from("admin_users").select("id,name,email,employee_no,role,active").eq("active", true).order("name", { ascending: true }),
    supabase.from("customers").select("id,name,phone,status").order("name", { ascending: true }).limit(200),
    supabase.from("products").select("id,sku,name,retail_price,active").eq("active", true).order("name", { ascending: true }).limit(300),
  ]);

  if (staffResult.error || customersResult.error || productsResult.error) {
    return {
      staffUsers: [],
      customers: [],
      products: [],
      error: staffResult.error?.message ?? customersResult.error?.message ?? productsResult.error?.message,
    };
  }

  return {
    staffUsers: (staffResult.data ?? []).map((user) => ({
      id: user.id,
      name: user.name || user.email || "Admin User",
      email: user.email ?? "",
      employeeNo: user.employee_no ?? "",
      role: user.role ?? "staff",
    })),
    customers: (customersResult.data ?? []).map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone ?? "",
      status: customer.status ?? "",
    })),
    products: (productsResult.data ?? []).map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      retailPrice: product.retail_price === null ? null : Number(product.retail_price),
    })),
  };
}
