import { createSupabaseAdminClient } from "@/lib/supabase/server";

type OrderRow = {
  id: string;
  order_no: string;
  customer_id: string | null;
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
  admin_notes: string | null;
  created_at: string | null;
};

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  facebook_name: string | null;
  messenger_link: string | null;
  location: string | null;
  business_type: string | null;
};

type OrderItemRow = {
  id: string;
  order_id: string | null;
  product_id: string | null;
  variant_id: string | null;
  variant_name_snapshot: string | null;
  variant_sku_snapshot: string | null;
  product_name_snapshot: string | null;
  sku_snapshot: string | null;
  quantity: number;
  unit_price_snapshot: number | string;
  subtotal: number | string;
  supplier_notes_snapshot: string | null;
};

type ProductRow = {
  id: string;
  image_url: string | null;
  stock_status: string | null;
};

type PaymentRecordRow = {
  id: string;
  order_id: string | null;
  payment_method: string | null;
  amount: number | string | null;
  reference_no: string | null;
  proof_image_url: string | null;
  status: string | null;
  created_at: string | null;
};

export type AdminOrderItem = {
  id: string;
  productId: string | null;
  image: string;
  sku: string;
  variantName: string;
  variantSku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  stockStatus: string;
  supplierNotesSnapshot: string;
};

export type AdminPaymentRecord = {
  id: string;
  method: string;
  amount: number;
  referenceNo: string;
  status: string;
  date: string;
  proofImageUrl: string | null;
};

export type AdminOrderRecord = {
  id: string;
  orderNo: string;
  createdAt: string;
  createdDate: string;
  customerName: string;
  customerPhone: string;
  facebookMessenger: string;
  location: string;
  businessType: string;
  receiverName: string;
  receiverPhone: string;
  receivingMethod: string;
  completeAddress: string;
  shippingFeePayment: string;
  shippingFeeAmount: number | null;
  shippingFeeStatus: string;
  orderNotes: string;
  productTotal: number;
  amountToConfirm: number;
  orderStatus: string;
  paymentStatus: string;
  items: AdminOrderItem[];
  payments: AdminPaymentRecord[];
  adminNotes: string;
};

export type AdminOrdersResult = {
  orders: AdminOrderRecord[];
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
}

function normalizeReceivingMethod(value: string | null) {
  if (value === "pick_up_at_store") {
    return "pickup";
  }

  if (value === "local_delivery_lalamove") {
    return "local_delivery";
  }

  return value ?? "to_be_arranged";
}

function normalizeShippingFeePayment(value: string | null) {
  if (value === "pickup_no_shipping_fee") {
    return "no_shipping_fee";
  }

  return value ?? "to_be_confirmed";
}

function normalizeOrderStatus(value: string | null) {
  if (value === "waiting_for_deposit") {
    return "waiting_deposit";
  }

  return value ?? "pending_confirmation";
}

function normalizeStockStatus(value: string | null) {
  return value ?? "for_order";
}

export async function getAdminOrders(): Promise<AdminOrdersResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { orders: [], error: "Supabase admin client is not configured." };
  }

  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id,order_no,customer_id,product_total,order_status,payment_status,receiver_name,receiver_phone,receiving_method,complete_address,shipping_fee_payment_method,shipping_fee_amount,shipping_fee_status,order_notes,admin_notes,created_at",
    )
    .order("created_at", { ascending: false });

  if (ordersError) {
    return { orders: [], error: ordersError.message };
  }

  const orders = (ordersData ?? []) as OrderRow[];
  const orderIds = orders.map((order) => order.id);
  const customerIds = [...new Set(orders.map((order) => order.customer_id).filter((id): id is string => Boolean(id)))];

  const [customersResult, itemsResult, paymentsResult] = await Promise.all([
    customerIds.length
      ? supabase.from("customers").select("id,name,phone,facebook_name,messenger_link,location,business_type").in("id", customerIds)
      : Promise.resolve({ data: [], error: null }),
    orderIds.length
      ? supabase
          .from("order_items")
          .select("id,order_id,product_id,variant_id,variant_name_snapshot,variant_sku_snapshot,product_name_snapshot,sku_snapshot,quantity,unit_price_snapshot,subtotal,supplier_notes_snapshot")
          .in("order_id", orderIds)
      : Promise.resolve({ data: [], error: null }),
    orderIds.length
      ? supabase.from("payment_records").select("id,order_id,payment_method,amount,reference_no,proof_image_url,status,created_at").in("order_id", orderIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (customersResult.error) {
    return { orders: [], error: customersResult.error.message };
  }

  if (itemsResult.error) {
    return { orders: [], error: itemsResult.error.message };
  }

  if (paymentsResult.error) {
    return { orders: [], error: paymentsResult.error.message };
  }

  const orderItems = (itemsResult.data ?? []) as OrderItemRow[];
  const productIds = [...new Set(orderItems.map((item) => item.product_id).filter((id): id is string => Boolean(id)))];
  const productsResult = productIds.length
    ? await supabase.from("products").select("id,image_url,stock_status").in("id", productIds)
    : { data: [], error: null };

  if (productsResult.error) {
    return { orders: [], error: productsResult.error.message };
  }

  const customersById = new Map(((customersResult.data ?? []) as CustomerRow[]).map((customer) => [customer.id, customer]));
  const productsById = new Map(((productsResult.data ?? []) as ProductRow[]).map((product) => [product.id, product]));
  const itemsByOrderId = new Map<string, OrderItemRow[]>();
  const paymentsByOrderId = new Map<string, PaymentRecordRow[]>();

  for (const item of orderItems) {
    if (!item.order_id) {
      continue;
    }

    itemsByOrderId.set(item.order_id, [...(itemsByOrderId.get(item.order_id) ?? []), item]);
  }

  for (const payment of (paymentsResult.data ?? []) as PaymentRecordRow[]) {
    if (!payment.order_id) {
      continue;
    }

    paymentsByOrderId.set(payment.order_id, [...(paymentsByOrderId.get(payment.order_id) ?? []), payment]);
  }

  return {
    orders: orders.map((order) => {
      const customer = order.customer_id ? customersById.get(order.customer_id) : undefined;
      const productTotal = Number(order.product_total ?? 0);

      return {
        id: order.id,
        orderNo: order.order_no,
        createdAt: order.created_at ?? "",
        createdDate: formatDate(order.created_at),
        customerName: customer?.name ?? "Unknown Customer",
        customerPhone: customer?.phone ?? "",
        facebookMessenger: customer?.messenger_link || customer?.facebook_name || "",
        location: customer?.location ?? "",
        businessType: customer?.business_type ?? "",
        receiverName: order.receiver_name ?? "",
        receiverPhone: order.receiver_phone ?? "",
        receivingMethod: normalizeReceivingMethod(order.receiving_method),
        completeAddress: order.complete_address ?? "",
        shippingFeePayment: normalizeShippingFeePayment(order.shipping_fee_payment_method),
        shippingFeeAmount: order.shipping_fee_amount === null ? null : Number(order.shipping_fee_amount),
        shippingFeeStatus: order.shipping_fee_status ?? "to_be_confirmed",
        orderNotes: order.order_notes ?? "",
        productTotal,
        amountToConfirm: productTotal,
        orderStatus: normalizeOrderStatus(order.order_status),
        paymentStatus: order.payment_status ?? "no_payment",
        adminNotes: order.admin_notes ?? "",
        items: (itemsByOrderId.get(order.id) ?? []).map((item) => {
          const product = item.product_id ? productsById.get(item.product_id) : undefined;

          return {
            id: item.id,
            productId: item.product_id,
            image: product?.image_url ?? "/products/phone-accessories.svg",
            sku: item.sku_snapshot ?? "",
            variantName: item.variant_name_snapshot ?? "",
            variantSku: item.variant_sku_snapshot ?? "",
            name: item.product_name_snapshot ?? "Wholesale item",
            quantity: item.quantity,
            unitPrice: Number(item.unit_price_snapshot),
            subtotal: Number(item.subtotal),
            stockStatus: normalizeStockStatus(product?.stock_status ?? null),
            supplierNotesSnapshot: item.supplier_notes_snapshot ?? "",
          };
        }),
        payments: (paymentsByOrderId.get(order.id) ?? []).map((payment) => ({
          id: payment.id,
          method: payment.payment_method ?? "",
          amount: Number(payment.amount ?? 0),
          referenceNo: payment.reference_no ?? "",
          status: payment.status ?? "pending",
          date: formatDate(payment.created_at),
          proofImageUrl: payment.proof_image_url,
        })),
      };
    }),
  };
}
