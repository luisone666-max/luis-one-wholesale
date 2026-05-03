import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type BulkProductCsvRow = {
  rowNumber: number;
  data: Record<string, string>;
};

export type BulkImportMissingCategoryMode = "create_inactive" | "skip";

export type BulkImportRowStatus = "ready" | "warning" | "error" | "skipped";

export type BulkImportPreviewRow = {
  rowNumber: number;
  sku: string;
  productName: string;
  categoryPath: string;
  moq: number | null;
  stockStatus: string;
  priceRange: string;
  active: boolean | null;
  status: BulkImportRowStatus;
  action: "create" | "update" | "skip";
  messages: string[];
};

export type BulkImportPreview = {
  rows: BulkImportPreviewRow[];
  summary: {
    totalRows: number;
    validRows: number;
    warningRows: number;
    errorRows: number;
    skippedRows: number;
  };
};

export type BulkImportSummary = {
  createdProducts: number;
  updatedProducts: number;
  skippedRows: number;
  createdCategories: number;
  errorCount: number;
  errors: string[];
};

type SupabaseAdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

type CategoryRow = {
  id: string;
  name_en: string;
  slug: string;
  parent_id: string | null;
  level: number;
  active: boolean | null;
  sort_order: number | null;
};

type ProductRow = {
  id: string;
  sku: string;
  slug: string;
};

type ParsedBulkRow = {
  rowNumber: number;
  sku: string;
  name: string;
  categoryName: string;
  subcategoryName: string;
  childCategoryName: string;
  brand: string | null;
  model: string | null;
  moq: number | null;
  stockStatus: string;
  leadTime: string | null;
  imageUrl: string | null;
  description: string | null;
  prices: Array<{ minQty: number; maxQty: number | null; unitPrice: number }>;
  supplierNotes: string | null;
  internalCostNotes: string | null;
  active: boolean | null;
  messages: string[];
  errors: string[];
};

type ResolvedBulkRow = ParsedBulkRow & {
  categoryId: string | null;
  subcategoryId: string | null;
  childCategoryId: string | null;
  existingProductId: string | null;
  slug: string;
  status: BulkImportRowStatus;
  action: "create" | "update" | "skip";
};

const stockStatuses = new Set(["ready_stock", "for_order", "low_stock", "unavailable"]);
const requiredHeaders = [
  "SKU",
  "Product Name",
  "Category",
  "MOQ",
  "Stock Status",
  "Active",
];

const priceColumns = [
  { header: "Price 1pc", minQty: 1, maxQty: 5 },
  { header: "Price 6pcs", minQty: 6, maxQty: 11 },
  { header: "Price 12pcs", minQty: 12, maxQty: 49 },
  { header: "Price 50pcs", minQty: 50, maxQty: null },
];

export const bulkUploadTemplateHeaders = [
  "SKU",
  "Product Name",
  "Category",
  "Subcategory",
  "Child Category",
  "Brand",
  "Model",
  "MOQ",
  "Stock Status",
  "Lead Time",
  "Image URL",
  "Description",
  "Price 1pc",
  "Price 6pcs",
  "Price 12pcs",
  "Price 50pcs",
  "Supplier Notes",
  "Internal Cost Notes",
  "Active",
];

function clean(value: string | undefined) {
  return (value ?? "").trim();
}

function nullableText(value: string | undefined) {
  const text = clean(value);
  return text || null;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function parsePositiveNumber(value: string) {
  const cleaned = value.replace(/[₱,$\s]/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function parseBoolean(value: string) {
  const normalized = normalize(value);

  if (!normalized) {
    return true;
  }

  if (["true", "yes", "1"].includes(normalized)) {
    return true;
  }

  if (["false", "no", "0"].includes(normalized)) {
    return false;
  }

  return null;
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `item-${Date.now()}`;
}

function categoryKey(name: string, parentId: string | null) {
  return `${parentId ?? "root"}::${normalize(name)}`;
}

function priceRange(prices: ParsedBulkRow["prices"]) {
  if (!prices.length) {
    return "-";
  }

  const values = prices.map((price) => price.unitPrice);
  return `₱${Math.min(...values).toLocaleString("en-US")} - ₱${Math.max(...values).toLocaleString("en-US")}`;
}

function getCategoryPath(row: ParsedBulkRow) {
  return [row.categoryName, row.subcategoryName, row.childCategoryName].filter(Boolean).join(" > ");
}

function validateHeaders(rows: BulkProductCsvRow[]) {
  const first = rows[0];

  if (!first) {
    return "CSV file is empty.";
  }

  const headers = new Set(Object.keys(first.data));
  const missing = requiredHeaders.filter((header) => !headers.has(header));

  return missing.length ? `Missing required CSV columns: ${missing.join(", ")}` : "";
}

function parseRows(rows: BulkProductCsvRow[]) {
  return rows.map((row) => {
    const messages: string[] = [];
    const errors: string[] = [];
    const sku = clean(row.data["SKU"]);
    const name = clean(row.data["Product Name"]);
    const categoryName = clean(row.data["Category"]);
    const subcategoryName = clean(row.data["Subcategory"]);
    const childCategoryName = clean(row.data["Child Category"]);
    const moqValue = clean(row.data["MOQ"]);
    const moqNumber = Number(moqValue);
    const moq = Number.isInteger(moqNumber) && moqNumber > 0 ? moqNumber : null;
    const stockStatus = clean(row.data["Stock Status"]) || "for_order";
    const active = parseBoolean(clean(row.data["Active"]));
    const prices = priceColumns.flatMap((column) => {
      const value = clean(row.data[column.header]);

      if (!value) {
        return [];
      }

      const unitPrice = parsePositiveNumber(value);

      if (unitPrice === null) {
        errors.push(`${column.header} must be a valid number.`);
        return [];
      }

      return [{ minQty: column.minQty, maxQty: column.maxQty, unitPrice }];
    });

    if (!sku) {
      errors.push("SKU is required.");
    }

    if (!name) {
      errors.push("Product Name is required.");
    }

    if (!categoryName) {
      errors.push("Category is required.");
    }

    if (!moq) {
      errors.push("MOQ must be a positive number.");
    }

    if (!stockStatuses.has(stockStatus)) {
      errors.push("Stock Status must be ready_stock, for_order, low_stock, or unavailable.");
    }

    if (active === null) {
      errors.push("Active must be true, false, yes, no, 1, or 0.");
    }

    if (childCategoryName && !subcategoryName) {
      errors.push("Child Category requires a Subcategory.");
    }

    if (active === true && !prices.length) {
      errors.push("At least one price tier is required for active products.");
    }

    if (prices.length) {
      const orderedPrices = [...prices].sort((a, b) => a.minQty - b.minQty);

      for (let index = 1; index < orderedPrices.length; index += 1) {
        if (orderedPrices[index].unitPrice > orderedPrices[index - 1].unitPrice) {
          errors.push("Higher quantity price should not be higher than lower quantity price.");
          break;
        }
      }
    }

    return {
      rowNumber: row.rowNumber,
      sku,
      name,
      categoryName,
      subcategoryName,
      childCategoryName,
      brand: nullableText(row.data["Brand"]),
      model: nullableText(row.data["Model"]),
      moq,
      stockStatus,
      leadTime: nullableText(row.data["Lead Time"]),
      imageUrl: nullableText(row.data["Image URL"]),
      description: nullableText(row.data["Description"]),
      prices,
      supplierNotes: nullableText(row.data["Supplier Notes"]),
      internalCostNotes: nullableText(row.data["Internal Cost Notes"]),
      active,
      messages,
      errors,
    };
  });
}

async function loadCatalog(admin: SupabaseAdminClient) {
  const [categoriesResult, productsResult] = await Promise.all([
    admin.from("categories").select("id,name_en,slug,parent_id,level,active,sort_order"),
    admin.from("products").select("id,sku,slug"),
  ]);

  if (categoriesResult.error) {
    throw new Error(categoriesResult.error.message);
  }

  if (productsResult.error) {
    throw new Error(productsResult.error.message);
  }

  const categories = (categoriesResult.data ?? []) as CategoryRow[];
  const products = (productsResult.data ?? []) as ProductRow[];

  return { categories, products };
}

function buildCategoryMap(categories: CategoryRow[]) {
  return new Map(categories.map((category) => [categoryKey(category.name_en, category.parent_id), category]));
}

function buildSlugSet(categories: CategoryRow[], products: ProductRow[]) {
  return new Set([...categories.map((category) => category.slug), ...products.map((product) => product.slug)]);
}

function uniqueSlug(base: string, usedSlugs: Set<string>, excludeSlug?: string) {
  const initialSlug = slugify(base);

  if (excludeSlug === initialSlug || !usedSlugs.has(initialSlug)) {
    usedSlugs.add(initialSlug);
    return initialSlug;
  }

  for (let index = 2; index < 10000; index += 1) {
    const nextSlug = `${initialSlug}-${index}`;

    if (excludeSlug === nextSlug || !usedSlugs.has(nextSlug)) {
      usedSlugs.add(nextSlug);
      return nextSlug;
    }
  }

  const fallback = `${initialSlug}-${Date.now()}`;
  usedSlugs.add(fallback);
  return fallback;
}

function resolveExistingCategory(categoryMap: Map<string, CategoryRow>, name: string, parentId: string | null) {
  if (!name) {
    return null;
  }

  return categoryMap.get(categoryKey(name, parentId)) ?? null;
}

function resolveRows(
  parsedRows: ParsedBulkRow[],
  categories: CategoryRow[],
  products: ProductRow[],
  missingCategoryMode: BulkImportMissingCategoryMode,
) {
  const categoryMap = buildCategoryMap(categories);
  const productsBySku = new Map(products.map((product) => [normalize(product.sku), product]));
  const usedSlugs = buildSlugSet(categories, products);

  return parsedRows.map((row): ResolvedBulkRow => {
    const messages = [...row.messages];
    const errors = [...row.errors];
    const existingProduct = productsBySku.get(normalize(row.sku)) ?? null;
    let action: "create" | "update" | "skip" = existingProduct ? "update" : "create";
    let status: BulkImportRowStatus = errors.length ? "error" : "ready";
    let categoryId: string | null = null;
    let subcategoryId: string | null = null;
    let childCategoryId: string | null = null;
    const mainCategory = resolveExistingCategory(categoryMap, row.categoryName, null);

    if (!mainCategory && row.categoryName) {
      messages.push(`Missing category "${row.categoryName}".`);
    } else {
      categoryId = mainCategory?.id ?? null;
    }

    if (row.subcategoryName && categoryId) {
      const subcategory = resolveExistingCategory(categoryMap, row.subcategoryName, categoryId);

      if (!subcategory) {
        messages.push(`Missing subcategory "${row.subcategoryName}".`);
      } else {
        subcategoryId = subcategory.id;
      }
    }

    if (row.childCategoryName && subcategoryId) {
      const childCategory = resolveExistingCategory(categoryMap, row.childCategoryName, subcategoryId);

      if (!childCategory) {
        messages.push(`Missing child category "${row.childCategoryName}".`);
      } else {
        childCategoryId = childCategory.id;
      }
    }

    if (messages.some((message) => message.startsWith("Missing"))) {
      if (missingCategoryMode === "skip") {
        action = "skip";
        status = errors.length ? "error" : "skipped";
      } else if (!errors.length) {
        status = "warning";
      }
    }

    if (!categoryId && missingCategoryMode === "skip") {
      action = "skip";
      status = errors.length ? "error" : "skipped";
    }

    const slug = existingProduct
      ? existingProduct.slug
      : uniqueSlug(row.name || row.sku, usedSlugs);

    return {
      ...row,
      messages,
      errors,
      categoryId,
      subcategoryId,
      childCategoryId,
      existingProductId: existingProduct?.id ?? null,
      slug,
      status,
      action,
    };
  });
}

function toPreview(rows: ResolvedBulkRow[]): BulkImportPreview {
  const previewRows = rows.map((row) => ({
    rowNumber: row.rowNumber,
    sku: row.sku,
    productName: row.name,
    categoryPath: getCategoryPath(row),
    moq: row.moq,
    stockStatus: row.stockStatus,
    priceRange: priceRange(row.prices),
    active: row.active,
    status: row.errors.length ? "error" : row.status,
    action: row.action,
    messages: [...row.errors, ...row.messages],
  }));

  return {
    rows: previewRows,
    summary: {
      totalRows: previewRows.length,
      validRows: previewRows.filter((row) => row.status === "ready").length,
      warningRows: previewRows.filter((row) => row.status === "warning").length,
      errorRows: previewRows.filter((row) => row.status === "error").length,
      skippedRows: previewRows.filter((row) => row.status === "skipped").length,
    },
  };
}

async function createCategory(
  admin: SupabaseAdminClient,
  name: string,
  parentId: string | null,
  level: number,
  usedSlugs: Set<string>,
) {
  const slug = uniqueSlug(name, usedSlugs);
  const { data, error } = await admin
    .from("categories")
    .insert({
      name_en: name,
      name_zh: null,
      slug,
      parent_id: parentId,
      level,
      active: false,
      show_on_homepage: false,
      show_in_navigation: false,
      sort_order: 999,
      template_type: "bulk_upload",
    })
    .select("id,name_en,slug,parent_id,level,active,sort_order")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? `Failed to create category ${name}.`);
  }

  return data as CategoryRow;
}

async function resolveOrCreateCategories(
  admin: SupabaseAdminClient,
  row: ResolvedBulkRow,
  categoryMap: Map<string, CategoryRow>,
  usedSlugs: Set<string>,
) {
  let createdCategories = 0;
  let mainCategory = resolveExistingCategory(categoryMap, row.categoryName, null);

  if (!mainCategory) {
    mainCategory = await createCategory(admin, row.categoryName, null, 1, usedSlugs);
    categoryMap.set(categoryKey(mainCategory.name_en, null), mainCategory);
    createdCategories += 1;
  }

  let subcategory: CategoryRow | null = null;

  if (row.subcategoryName) {
    subcategory = resolveExistingCategory(categoryMap, row.subcategoryName, mainCategory.id);

    if (!subcategory) {
      subcategory = await createCategory(admin, row.subcategoryName, mainCategory.id, 2, usedSlugs);
      categoryMap.set(categoryKey(subcategory.name_en, mainCategory.id), subcategory);
      createdCategories += 1;
    }
  }

  let childCategory: CategoryRow | null = null;

  if (row.childCategoryName) {
    if (!subcategory) {
      throw new Error(`Row ${row.rowNumber}: Child Category requires a Subcategory.`);
    }

    childCategory = resolveExistingCategory(categoryMap, row.childCategoryName, subcategory.id);

    if (!childCategory) {
      childCategory = await createCategory(admin, row.childCategoryName, subcategory.id, 3, usedSlugs);
      categoryMap.set(categoryKey(childCategory.name_en, subcategory.id), childCategory);
      createdCategories += 1;
    }
  }

  return {
    createdCategories,
    categoryId: mainCategory.id,
    subcategoryId: subcategory?.id ?? null,
    childCategoryId: childCategory?.id ?? null,
  };
}

async function replacePriceTiers(admin: SupabaseAdminClient, productId: string, prices: ParsedBulkRow["prices"]) {
  const { error: deleteError } = await admin.from("product_price_tiers").delete().eq("product_id", productId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (!prices.length) {
    return;
  }

  const { error: insertError } = await admin.from("product_price_tiers").insert(
    prices.map((price) => ({
      product_id: productId,
      min_qty: price.minQty,
      max_qty: price.maxQty,
      unit_price: price.unitPrice,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function previewBulkProductRows(
  rows: BulkProductCsvRow[],
  missingCategoryMode: BulkImportMissingCategoryMode,
): Promise<BulkImportPreview> {
  const headerError = validateHeaders(rows);

  if (headerError) {
    return {
      rows: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        warningRows: 0,
        errorRows: 1,
        skippedRows: 0,
      },
    };
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { categories, products } = await loadCatalog(admin);
  return toPreview(resolveRows(parseRows(rows), categories, products, missingCategoryMode));
}

export async function importBulkProductRows(
  rows: BulkProductCsvRow[],
  missingCategoryMode: BulkImportMissingCategoryMode,
): Promise<{ preview: BulkImportPreview; importSummary: BulkImportSummary }> {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const headerError = validateHeaders(rows);

  if (headerError) {
    throw new Error(headerError);
  }

  const { categories, products } = await loadCatalog(admin);
  const parsedRows = parseRows(rows);
  const resolvedRows = resolveRows(parsedRows, categories, products, missingCategoryMode);
  const categoryMap = buildCategoryMap(categories);
  const usedSlugs = buildSlugSet(categories, products);
  const summary: BulkImportSummary = {
    createdProducts: 0,
    updatedProducts: 0,
    skippedRows: 0,
    createdCategories: 0,
    errorCount: 0,
    errors: [],
  };

  for (const row of resolvedRows) {
    if (row.errors.length || row.action === "skip") {
      summary.skippedRows += 1;
      summary.errorCount += row.errors.length ? 1 : 0;
      summary.errors.push(...row.errors.map((error) => `Row ${row.rowNumber}: ${error}`));
      continue;
    }

    try {
      const categoryIds = missingCategoryMode === "create_inactive"
        ? await resolveOrCreateCategories(admin, row, categoryMap, usedSlugs)
        : {
            createdCategories: 0,
            categoryId: row.categoryId,
            subcategoryId: row.subcategoryId,
            childCategoryId: row.childCategoryId,
          };

      if (!categoryIds.categoryId) {
        summary.skippedRows += 1;
        summary.errors.push(`Row ${row.rowNumber}: Category could not be resolved.`);
        continue;
      }

      summary.createdCategories += categoryIds.createdCategories;

      if (row.existingProductId) {
        const { error } = await admin
          .from("products")
          .update({
            name: row.name,
            category_id: categoryIds.categoryId,
            subcategory_id: categoryIds.subcategoryId,
            child_category_id: categoryIds.childCategoryId,
            brand: row.brand,
            model: row.model,
            moq: row.moq ?? 1,
            stock_status: row.stockStatus,
            lead_time: row.leadTime,
            image_url: row.imageUrl,
            description: row.description,
            supplier_notes: row.supplierNotes,
            internal_cost_notes: row.internalCostNotes,
            active: Boolean(row.active),
          })
          .eq("id", row.existingProductId);

        if (error) {
          throw new Error(error.message);
        }

        await replacePriceTiers(admin, row.existingProductId, row.prices);
        summary.updatedProducts += 1;
      } else {
        const { data, error } = await admin
          .from("products")
          .insert({
            sku: row.sku,
            name: row.name,
            slug: row.slug,
            category_id: categoryIds.categoryId,
            subcategory_id: categoryIds.subcategoryId,
            child_category_id: categoryIds.childCategoryId,
            brand: row.brand,
            model: row.model,
            moq: row.moq ?? 1,
            stock_status: row.stockStatus,
            lead_time: row.leadTime,
            image_url: row.imageUrl,
            description: row.description,
            supplier_notes: row.supplierNotes,
            internal_cost_notes: row.internalCostNotes,
            active: Boolean(row.active),
          })
          .select("id")
          .single();

        if (error || !data) {
          throw new Error(error?.message ?? "Product creation failed.");
        }

        await replacePriceTiers(admin, (data as { id: string }).id, row.prices);
        summary.createdProducts += 1;
      }
    } catch (error) {
      summary.errorCount += 1;
      summary.errors.push(`Row ${row.rowNumber}: ${error instanceof Error ? error.message : "Import failed."}`);
    }
  }

  return { preview: toPreview(resolvedRows), importSummary: summary };
}
