import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const failures = [];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function requireIncludes(relativePath, contents, snippets) {
  for (const snippet of snippets) {
    if (!contents.includes(snippet)) {
      failures.push(`${relativePath} is missing required checkout safety guard: ${snippet}`);
    }
  }
}

function requirePattern(relativePath, contents, pattern, description) {
  if (!pattern.test(contents)) {
    failures.push(`${relativePath} is missing required checkout safety guard: ${description}`);
  }
}

async function main() {
  const submitRoutePath = "src/app/api/orders/submit/route.ts";
  const customerCartPath = "src/lib/customer-cart.ts";
  const checkoutFormPath = "src/components/CheckoutForm.tsx";
  const productDetailPath = "src/components/ProductDetailExperience.tsx";

  const [submitRoute, customerCart, checkoutForm, productDetail] = await Promise.all([
    read(submitRoutePath),
    read(customerCartPath),
    read(checkoutFormPath),
    read(productDetailPath),
  ]);

  requireIncludes(submitRoutePath, submitRoute, [
    "getBearerToken(request)",
    "Please login before placing an order.",
    "auth.getUser(token)",
    ".eq(\"auth_user_id\", user.id)",
    ".from(\"cart_items\")",
    ".eq(\"customer_id\", customerId)",
    ".from(\"products\").select(\"id,sku,name,moq,active,stock_status,supplier_notes\")",
    ".from(\"product_price_tiers\")",
    ".from(\"product_variant_price_tiers\")",
    "isUnavailableStockStatus(product.stock_status)",
    "isUnavailableStockStatus(variant.stock_status)",
    "cartItem.quantity < moq",
    "Contact us for quotation.",
    "variant_name_snapshot",
    "variant_sku_snapshot",
    "unit_price_snapshot",
    "supplier_notes_snapshot: product.supplier_notes",
    ".from(\"cart_items\").delete().eq(\"customer_id\", customerId)",
  ]);

  requirePattern(
    submitRoutePath,
    submitRoute,
    /return\s+NextResponse\.json\(\{\s*ok:\s*true,\s*orderNo:\s*\(orderData as \{ order_no: string \}\)\.order_no\s*\}\);/,
    "success response returns only ok + orderNo",
  );

  requireIncludes(customerCartPath, customerCart, [
    "getCurrentCustomerSession()",
    "Please login or register to place order.",
    ".from(\"customer_products\")",
    "isUnavailableStockStatus(product.stock_status)",
    "This item is currently unavailable for direct order.",
    "Please select a variant before adding this product.",
    "This variant is currently unavailable for direct order.",
    "getWholesalePriceForQuantity(productId, nextQuantity",
    ".eq(\"customer_id\", customer.id)",
    ".is(\"variant_id\", null)",
    ".from(\"cart_items\").delete().eq(\"id\", cartItemId).eq(\"customer_id\", customer.id)",
  ]);

  requireIncludes(checkoutFormPath, checkoutForm, [
    "if (!items.length)",
    "invalidCartItem",
    "Please login before placing an order.",
    "authorization: `Bearer ${session.access_token}`",
    "fetch(\"/api/orders/submit\"",
    "router.push(`/order-success?order=${encodeURIComponent(result.orderNo)}`)",
    "J&T Express COD total includes the estimated shipping fee when available.",
    "Lalamove is arranged manually by Luis One or booked directly by the customer",
    "Store pickup has no shipping fee.",
  ]);

  requireIncludes(productDetailPath, productDetail, [
    "activeVariants.length && !selectedVariant",
    "Please select a variant before adding this product.",
    "quotationOnly",
    "directOrderUnavailable",
    "Ask Price on Messenger",
    "Ask Availability on Messenger",
    "trackMetaEvent(\"AddToCart\"",
    "notifyCustomerCartUpdated()",
  ]);

  if (/return\s+NextResponse\.json\([\s\S]{0,300}supplier_notes/i.test(submitRoute)) {
    failures.push(`${submitRoutePath} appears to return supplier notes in an API response.`);
  }

  if (failures.length) {
    console.error("Checkout safety check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Checkout safety check passed:");
  console.log("- checkout API requires a customer session and customer-owned cart");
  console.log("- server recalculates MOQ, variant/product availability, and price tiers");
  console.log("- order items store product/variant price snapshots and clear the cart after submit");
  console.log("- customer cart/detail UI blocks direct checkout for unavailable or quotation-only items");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
