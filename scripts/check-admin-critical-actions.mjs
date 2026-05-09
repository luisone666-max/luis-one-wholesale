import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function requireIncludes(relativePath, snippets) {
  const contents = read(relativePath);

  for (const snippet of snippets) {
    if (!contents.includes(snippet)) {
      failures.push(`${relativePath} is missing critical admin workflow wiring: ${snippet}`);
    }
  }
}

function requirePattern(relativePath, pattern, description) {
  const contents = read(relativePath);

  if (!pattern.test(contents)) {
    failures.push(`${relativePath} is missing critical admin workflow wiring: ${description}`);
  }
}

function main() {
  requireIncludes("src/components/admin/AdminProductsClient.tsx", [
    "Save / Upload Product",
    "readyToSave",
    "saveActionLabel",
    "selectedImage ? copy.selectedImageSaveHint",
    "onSaved(result.productId ?? draft.id, { revealSavedProduct: mode === \"create\" })",
    "fetch(\"/api/admin/products/image-upload\"",
    "uploadVariantImage",
    "onAddTier={() => updateDraft({ tiers: [...draft.tiers",
    "onAddTier={() => updateVariant(variantIndex, { tiers: [...variant.tiers",
    "duplicateProduct",
    "toggleVisibility",
    "deleteProduct",
    "productListUpdated",
  ]);

  requireIncludes("src/app/api/admin/products/route.ts", [
    "parseProductPayload",
    "assertUniqueProduct",
    "assertUniqueVariantSkus",
    "Only product managers can create products.",
    "retail_price: payload.retailPrice",
    "product_price_tiers",
    "saveProductVariants",
    "revalidateCatalogPages()",
    "action: \"product_created\"",
  ]);

  requireIncludes("src/app/api/admin/products/[id]/route.ts", [
    "mode === \"visibility\"",
    "action: Boolean(rawPayload.active) ? \"product_unhidden\" : \"product_hidden\"",
    "parseProductPayload",
    "assertUniqueVariantSkus",
    "product_price_tiers",
    "saveProductVariants",
    "revalidateCatalogPages()",
    "action: \"product_updated\"",
    "from(\"order_items\")",
    "This product has order history. Please hide the product instead of deleting it.",
    "action: \"product_deleted\"",
  ]);

  requireIncludes("src/app/api/admin/products/[id]/duplicate/route.ts", [
    "uniqueValue",
    "product_price_tiers",
    "product_variants",
    "product_variant_price_tiers",
    "active: false",
    "revalidateCatalogPages()",
  ]);

  requireIncludes("src/components/admin/AdminCategoriesClient.tsx", [
    "saveCategory",
    "toggleCategory",
    "reorderCategory",
    "deleteCategory",
    "applyTemplate",
    "fetch(\"/api/admin/categories/image-upload\"",
    "Image uploaded. Save the category to keep it.",
  ]);

  requireIncludes("src/app/api/admin/categories/route.ts", [
    "parseCategoryPayload",
    "assertUniqueSlug",
    "level > 3",
    "image_url: payload.imageUrl",
    "revalidateCatalogPages()",
    "action: \"category_created\"",
  ]);

  requireIncludes("src/app/api/admin/categories/[id]/route.ts", [
    "rawPayload.mode === \"toggle\"",
    "rawPayload.mode === \"reorder\"",
    "assertMoveIsValid",
    "Move blocked: category depth cannot exceed 3 levels.",
    "This category has child categories. Please move or delete child categories first.",
    "This category has products. Please move or hide products before deleting.",
    "action: \"category_toggled\"",
    "action: \"category_updated\"",
    "action: \"category_deleted\"",
  ]);

  requireIncludes("src/components/admin/AdminSalesDeskClient.tsx", [
    "AdminOperationGuide",
    "Sales Desk creates the slip only",
    "does not confirm payment",
    "Sales Slip Check",
    "SalesGuardCard",
    "manualItemCount",
    "changedPriceCount",
    "Member selected: points will be awarded after cashier confirms payment.",
    "Manual item: offline-only item, not linked to website catalog.",
    "Manual item, discount, or negotiated price requires a price / discount note before sending to cashier.",
    "needsPriceAuditNote",
    "discountIsTooHigh",
    "auditNoteTriggerCount",
    "Save and Send to Cashier",
    "Sales Slip Status",
    "sendToCashierNow",
    "meaningfulItems",
    "canSubmitSale",
    "employeeNo",
    "customerName",
    "paymentMethod",
    "items",
    "fetch(editingSaleId ? `/api/admin/pos/sales/${editingSaleId}` : \"/api/admin/pos/sales\"",
    "method: editingSaleId ? \"PATCH\" : \"POST\"",
    "loadSaleForEdit",
    "runSaleAction",
    "void_paid",
    "AdminPosSalePrintTemplate",
    "monthSales",
  ]);

  requireIncludes("src/app/api/admin/pos/sales/route.ts", [
    "canUseSalesDesk",
    "canUseCashierCenter",
    "Sales staff can only create sales using their own employee number.",
    "Customer name is required.",
    "At least one sale item is required.",
    "Discount cannot be greater than product total.",
    "status: \"waiting_cashier\"",
    "writePosSaleAuditLog",
  ]);

  requireIncludes("src/app/api/admin/pos/sales/[id]/route.ts", [
    "editableStatuses",
    "Only waiting or returned sales can be edited.",
    "You can only edit your own sales slips.",
    "Sales staff can only use their own employee number.",
    "action === \"cancel\"",
    "action === \"return_to_sales\"",
    "action === \"void_paid\"",
    "Only admin or owner can void paid sales.",
    "customer_loyalty_point_transactions",
    "writePosSaleAuditLog",
  ]);

  requireIncludes("src/components/admin/AdminCashierClient.tsx", [
    "AdminOperationGuide",
    "Cashier confirms money received",
    "return the slip to Sales Desk",
    "/api/admin/pos/sales?status=waiting_cashier",
    "Cashier Queue",
    "cashierQueueStatus",
    "waitingSummary.cashCount",
    "waitingSummary.transferCount",
    "nextSale",
    "confirm(sale",
    "confirm-payment",
    "return_to_sales",
    "referenceRequired",
    "cashDrawerUpdated",
    "CashierGuardCard",
    "Payment Confirmation Check",
    "Amount must match the sale slip before confirmation.",
    "Wrong customer, product, price, or payment method? Return to Sales Desk.",
    "readyToConfirm",
    "blockedConfirm",
  ]);

  requireIncludes("src/app/api/admin/pos/sales/[id]/confirm-payment/route.ts", [
    "canUseCashierCenter",
    "Only cashier, admin, or owner can confirm payment.",
    "Payment amount must match the sale amount before confirming.",
    "Reference number is required for GCash or bank transfer payments.",
    "pos_payment_confirmations",
    "status: \"paid\"",
    "awardCustomerLoyaltyPoints",
    "getCashDrawerData",
    "cashDrawer",
  ]);

  requireIncludes("src/components/admin/AdminCashDrawerClient.tsx", [
    "AdminOperationGuide",
    "Daily cash drawer is for physical cash control",
    "GCash and bank transfers are visible here",
    "Open Cash Drawer",
    "Daily Cash Reconciliation",
    "Physical cash formula",
    "FormulaStep",
    "data.transferSalesTotal",
    "Expected cash = opening cash + confirmed cash payments",
    "GCash and bank transfers are shown separately",
    "DrawerChecklistCard",
    "Closing Checklist",
    "Enter the actual counted cash before closing the drawer.",
    "Confirmed cash payments are included automatically.",
    "disabled={loading || !canCloseDrawer}",
    "fetch(\"/api/admin/cash-drawer\"",
    "action: \"open\"",
    "action: \"add_entry\"",
    "action: \"close\"",
    "AdminCashDrawerPrintTemplate",
  ]);

  requireIncludes("src/app/api/admin/cash-drawer/route.ts", [
    "canUseCashierCenter",
    "action === \"open\"",
    "cash_drawer_sessions",
    "action === \"add_entry\"",
    "cash_drawer_entries",
    "action === \"close\"",
    "expected_cash",
    "difference_amount",
  ]);

  requireIncludes("src/app/api/admin/staff/route.ts", [
    "canManageStaff",
    "verifyOwnerActionPassword",
    "roles",
    "employee_no",
    "Only owner can create another owner account.",
    "admin.auth.admin.createUser",
    "admin.auth.admin.deleteUser",
    "action: \"staff_created\"",
  ]);

  requireIncludes("src/app/api/admin/audit-logs/route.ts", [
    "admin_action_audit_logs",
    "Only owner or admin can view audit logs.",
    "limit(80)",
  ]);

  requireIncludes("src/components/admin/AdminDashboardClient.tsx", [
    "Business Health",
    "Daily Operating Checklist",
    "openIssueCount",
    "HealthCard",
    "data.pendingOnlineOrders",
    "data.waitingCashierCount",
    "data.lowStockProducts",
    "data.hiddenProducts",
  ]);

  requireIncludes("src/components/admin/AdminOperationsGuideClient.tsx", [
    "Handoff flow",
    "Sales creates the slip, Cashier confirms money",
    "member points",
    "Do not confirm payment before receiving money.",
    "/admin/sales-desk",
    "/admin/cashier",
    "/admin/cash-drawer",
    "/admin/reports",
    "/admin/staff",
    "Use manual items only for offline products",
  ]);

  requireIncludes("src/components/admin/AdminReportsClient.tsx", [
    "Owner Diagnosis",
    "collectionRate",
    "salesMix",
    "cashControl",
    "pendingRisk",
    "exceptionRate",
    "staffCoverage",
    "monthExceptionTotal",
    "monthTransferTotal",
    "monthPendingTotal",
  ]);

  requireIncludes("src/components/admin/AdminCustomersClient.tsx", [
    "Member Overview",
    "Every PHP 100 paid = 1 point",
    "CustomerMetricCard",
    "getCustomerSegment",
    "filterHasPoints",
    "filterRepeat",
    "/admin/customers/${customer.id}",
  ]);

  requireIncludes("src/app/admin/customers/[id]/page.tsx", [
    "requireActiveAdminPage",
    "canViewCustomerRecords",
    "getAdminCustomerDetail",
    "AdminCustomerDetailClient",
  ]);

  requireIncludes("src/components/admin/AdminCustomerDetailClient.tsx", [
    "Customer Profile",
    "Recommended Follow-up",
    "getFollowUpActions",
    "vipFollowUpTitle",
    "missingContactTitle",
    "Online Orders",
    "Offline POS Sales",
    "Points Ledger",
    "If a walk-in customer wants points",
  ]);

  requireIncludes("src/lib/admin-audit-log.ts", [
    "server-only",
    "admin_action_audit_logs",
    "previous_data",
    "new_data",
    "metadata",
  ]);

  requirePattern(
    "src/components/admin/AdminProductsClient.tsx",
    /const\s+readyToSave\s*=\s*basicReady\s*&&\s*priceReady/,
    "product editor blocks saving until basic info and at least one wholesale tier are ready",
  );

  if (failures.length) {
    console.error("Admin critical actions check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Admin critical actions check passed:");
  console.log("- product save/upload, variants, wholesale tiers, image upload, duplicate, hide/delete remain wired");
  console.log("- category create/edit/toggle/reorder/delete/template/image workflows remain wired");
  console.log("- sales desk, cashier confirmation, cash drawer, staff setup, and audit log workflows remain wired");
}

main();
