import "server-only";

import { getJntConfigStatus } from "@/lib/jnt-logistics";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type ProductLogisticsRow = {
  id: string;
  weight_grams: number | string | null;
  length_cm: number | string | null;
  width_cm: number | string | null;
  height_cm: number | string | null;
  cod_enabled: boolean | null;
  shipping_category: string | null;
};

type ShipmentRow = {
  order_id: string;
  shipment_status: string | null;
  cod_status: string | null;
};

type OrderRow = {
  id: string;
  order_status: string | null;
  receiving_method: string | null;
  shipping_fee_payment_method: string | null;
};

export type AdminLogisticsReadiness = {
  jntStatus: ReturnType<typeof getJntConfigStatus>;
  productStats: {
    activeProducts: number;
    activeVariants: number;
    productsMissingWeight: number;
    productsMissingDimensions: number;
    variantsMissingWeight: number;
    variantsMissingDimensions: number;
    codDisabledProducts: number;
    restrictedProducts: number;
  };
  shipmentStats: {
    total: number;
    draft: number;
    readyToBook: number;
    booked: number;
    inTransit: number;
    delivered: number;
    failedOrCancelled: number;
    pendingCodCollection: number;
    ordersNeedingShipmentDraft: number;
  };
  errors: string[];
};

function hasPositiveNumber(value: number | string | null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0;
}

function hasDimensions(row: ProductLogisticsRow) {
  return hasPositiveNumber(row.length_cm) && hasPositiveNumber(row.width_cm) && hasPositiveNumber(row.height_cm);
}

function summarizeProducts(rows: ProductLogisticsRow[]) {
  return {
    missingWeight: rows.filter((row) => !hasPositiveNumber(row.weight_grams)).length,
    missingDimensions: rows.filter((row) => !hasDimensions(row)).length,
    codDisabled: rows.filter((row) => row.cod_enabled === false).length,
    restricted: rows.filter((row) => row.shipping_category === "restricted").length,
  };
}

function emptyReadiness(errors: string[] = []): AdminLogisticsReadiness {
  return {
    jntStatus: getJntConfigStatus(),
    productStats: {
      activeProducts: 0,
      activeVariants: 0,
      productsMissingWeight: 0,
      productsMissingDimensions: 0,
      variantsMissingWeight: 0,
      variantsMissingDimensions: 0,
      codDisabledProducts: 0,
      restrictedProducts: 0,
    },
    shipmentStats: {
      total: 0,
      draft: 0,
      readyToBook: 0,
      booked: 0,
      inTransit: 0,
      delivered: 0,
      failedOrCancelled: 0,
      pendingCodCollection: 0,
      ordersNeedingShipmentDraft: 0,
    },
    errors,
  };
}

export async function getAdminLogisticsReadiness(): Promise<AdminLogisticsReadiness> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return emptyReadiness(["Supabase admin client is not configured."]);
  }

  const [productsResult, variantsResult, shipmentsResult, ordersResult] = await Promise.all([
    supabase
      .from("products")
      .select("id,weight_grams,length_cm,width_cm,height_cm,cod_enabled,shipping_category")
      .eq("active", true),
    supabase
      .from("product_variants")
      .select("id,weight_grams,length_cm,width_cm,height_cm,cod_enabled,shipping_category")
      .eq("active", true),
    supabase.from("order_shipments").select("order_id,shipment_status,cod_status"),
    supabase
      .from("orders")
      .select("id,order_status,receiving_method,shipping_fee_payment_method")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const errors = [productsResult.error, variantsResult.error, shipmentsResult.error, ordersResult.error]
    .map((error) => error?.message)
    .filter((message): message is string => Boolean(message));

  const productRows = (productsResult.data ?? []) as ProductLogisticsRow[];
  const variantRows = (variantsResult.data ?? []) as ProductLogisticsRow[];
  const shipmentRows = (shipmentsResult.data ?? []) as ShipmentRow[];
  const orderRows = (ordersResult.data ?? []) as OrderRow[];
  const productSummary = summarizeProducts(productRows);
  const variantSummary = summarizeProducts(variantRows);
  const shipmentOrderIds = new Set(shipmentRows.map((shipment) => shipment.order_id));
  const shippableOrderRows = orderRows.filter((order) => {
    const methodRequiresShipment =
      order.receiving_method === "courier_shipping" ||
      order.receiving_method === "local_delivery" ||
      order.receiving_method === "local_delivery_lalamove";
    const activeOrder = !["cancelled", "completed", "delivered"].includes(order.order_status ?? "");
    return methodRequiresShipment && activeOrder;
  });

  return {
    jntStatus: getJntConfigStatus(),
    productStats: {
      activeProducts: productRows.length,
      activeVariants: variantRows.length,
      productsMissingWeight: productSummary.missingWeight,
      productsMissingDimensions: productSummary.missingDimensions,
      variantsMissingWeight: variantSummary.missingWeight,
      variantsMissingDimensions: variantSummary.missingDimensions,
      codDisabledProducts: productSummary.codDisabled,
      restrictedProducts: productSummary.restricted,
    },
    shipmentStats: {
      total: shipmentRows.length,
      draft: shipmentRows.filter((shipment) => shipment.shipment_status === "draft").length,
      readyToBook: shipmentRows.filter((shipment) => shipment.shipment_status === "ready_to_book").length,
      booked: shipmentRows.filter((shipment) => shipment.shipment_status === "booked").length,
      inTransit: shipmentRows.filter((shipment) => shipment.shipment_status === "in_transit").length,
      delivered: shipmentRows.filter((shipment) => shipment.shipment_status === "delivered").length,
      failedOrCancelled: shipmentRows.filter((shipment) => ["failed", "cancelled", "returned"].includes(shipment.shipment_status ?? "")).length,
      pendingCodCollection: shipmentRows.filter((shipment) => shipment.cod_status === "pending_collection").length,
      ordersNeedingShipmentDraft: shippableOrderRows.filter((order) => !shipmentOrderIds.has(order.id)).length,
    },
    errors,
  };
}
