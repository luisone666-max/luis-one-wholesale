"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import { formatImageBytes, prepareAdminUploadImage } from "@/lib/admin-image-compression";
import type { TranslationKey } from "@/lib/admin-i18n";
import type { AdminCategoryOption, AdminProductRecord, AdminProductTier, AdminProductVariant } from "@/lib/admin-products-data";

type EditorMode = "view" | "create" | "edit";
type ProductDraft = {
  id?: string;
  sku: string;
  name: string;
  slug: string;
  categoryId: string;
  subcategoryId: string;
  childCategoryId: string;
  brand: string;
  model: string;
  moq: number;
  retailPrice: number | null;
  stockStatus: string;
  leadTime: string;
  imageUrl: string;
  description: string;
  active: boolean;
  supplierNotes: string;
  internalCostNotes: string;
  adminNotes: string;
  tiers: AdminProductTier[];
  variants: AdminProductVariant[];
};

const defaultPageSize = 24;
const stockStatuses = ["ready_stock", "for_order", "low_stock", "unavailable"];
const productTabs: TranslationKey[] = ["basicInfo", "wholesalePricesTab", "variantsTab", "imagesTab", "supplierNotesTab", "adminNotesTab"];

const text = {
  en: {
    addTier: "Add Tier",
    maxQtyBlank: "Leave blank for 50+ tier",
    saveProduct: "Save Product",
    createProduct: "Create Product",
    formHint: "Supplier notes and cost notes are admin-only.",
    allCategories: "All categories",
    allStock: "All stock statuses",
    allVisibility: "All active / hidden",
    noProducts: "No products found.",
    confirmDelete: "Delete this product?",
    duplicateDone: "Product duplicated.",
    hiddenFromFrontend: "Hidden products are not shown on customer frontend.",
    deleteBlocked: "If this product has order history, hide it instead of deleting.",
    imageUploadHint: "Upload JPG, PNG, or WebP images up to 2MB. Uploaded URL is saved when you save the product.",
    chooseImage: "Choose Image",
    uploadImage: "Upload Image",
    replaceImage: "Replace Image",
    removeImage: "Remove Image",
    selectedImage: "Selected image",
    imagePreview: "Image Preview",
    imageTooLarge: "Image file must be 2MB or smaller.",
    imageInvalidType: "Only JPG, PNG, and WebP image files are allowed.",
    imageUploadSuccess: "Image uploaded. Save the product to keep this image.",
    imageUploadFailed: "Image upload failed.",
    productUploadSuccess: "Product uploaded successfully.",
    productUpdateSuccess: "Product saved successfully.",
    categoryBrowser: "Category Browser",
    allProducts: "All Products",
    productCountLabel: "products",
    imageSize: "Image size",
    compactImages: "Compact",
    normalImages: "Normal",
    largeImages: "Large",
    variantsHint: "Use variants when one product has multiple models, fitments, images, MOQ, stock, or prices.",
    noVariants: "No variants yet. Products without variants still use the main product price tiers.",
    variantImageHint: "Variant image URL overrides the main product image after customer selection.",
  },
  zh: {
    addTier: "新增价格阶梯",
    maxQtyBlank: "留空表示 50+ 阶梯",
    saveProduct: "保存商品",
    createProduct: "新增商品",
    formHint: "供应商备注和成本备注仅后台可见。",
    allCategories: "全部分类",
    allStock: "全部库存状态",
    allVisibility: "全部上架/隐藏",
    noProducts: "没有找到商品。",
    confirmDelete: "确定删除这个商品？",
    duplicateDone: "商品已复制。",
    hiddenFromFrontend: "隐藏商品不会显示在客户前台。",
    deleteBlocked: "如果商品有订单历史，请隐藏商品，不要删除。",
  },
};

const stockStatusKeyByValue: Record<string, TranslationKey> = {
  ready_stock: "readyStock",
  for_order: "forOrder",
  low_stock: "lowStock",
  unavailable: "unavailable",
};

const imageUploadText = {
  en: {
    imageUploadHint: "Upload JPG, PNG, or WebP images up to 2MB. Uploaded URL is saved when you save the product.",
    chooseImage: "Choose Image",
    uploadImage: "Upload Image",
    replaceImage: "Replace Image",
    removeImage: "Remove Image",
    selectedImage: "Selected image",
    imagePreview: "Image Preview",
    imageTooLarge: "Image file must be 2MB or smaller.",
    imageInvalidType: "Only JPG, PNG, and WebP image files are allowed.",
    imageUploadSuccess: "Image uploaded. Save the product to keep this image.",
    imageUploadFailed: "Image upload failed.",
    categoryBrowser: "Category Browser",
    allProducts: "All Products",
    productCountLabel: "products",
    imageSize: "Image size",
    compactImages: "Compact",
    normalImages: "Normal",
    largeImages: "Large",
  },
  zh: {
    imageUploadHint: "上传 JPG、PNG 或 WebP 图片，最大 2MB。上传后的 URL 会在保存商品时写入。",
    chooseImage: "选择图片",
    uploadImage: "上传图片",
    replaceImage: "替换图片",
    removeImage: "移除图片",
    selectedImage: "已选择图片",
    imagePreview: "图片预览",
    imageTooLarge: "图片不能超过 2MB。",
    imageInvalidType: "只允许 JPG、PNG、WebP 图片。",
    imageUploadSuccess: "图片已上传。请保存商品以保留这张图片。",
    imageUploadFailed: "图片上传失败。",
    categoryBrowser: "分类浏览",
    allProducts: "全部商品",
    productCountLabel: "个商品",
    imageSize: "图片大小",
    compactImages: "小图",
    normalImages: "标准",
    largeImages: "大图",
  },
};

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function productToDraft(product: AdminProductRecord): ProductDraft {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    categoryId: product.categoryId ?? "",
    subcategoryId: product.subcategoryId ?? "",
    childCategoryId: product.childCategoryId ?? "",
    brand: product.brand,
    model: product.model,
    moq: product.moq,
    retailPrice: product.retailPrice,
    stockStatus: product.stockStatus,
    leadTime: product.leadTime,
    imageUrl: product.image,
    description: product.description,
    active: product.active,
    supplierNotes: product.supplierNotes,
    internalCostNotes: product.internalCostNotes,
    adminNotes: product.adminNotes,
    tiers: product.tiers.length ? product.tiers : defaultTiers(),
    variants: product.variants.map((variant) => ({
      ...variant,
      tiers: variant.tiers.length ? variant.tiers : defaultTiers(),
    })),
  };
}

function defaultTiers(): AdminProductTier[] {
  return [
    { minQty: 1, maxQty: 5, unitPrice: 100 },
    { minQty: 6, maxQty: 11, unitPrice: 95 },
    { minQty: 12, maxQty: 49, unitPrice: 90 },
    { minQty: 50, maxQty: null, unitPrice: 85 },
  ];
}

function blankDraft(categories: AdminCategoryOption[]): ProductDraft {
  const firstMain = categories.find((category) => category.level === 1);

  return {
    sku: "",
    name: "",
    slug: "",
    categoryId: firstMain?.id ?? "",
    subcategoryId: "",
    childCategoryId: "",
    brand: "",
    model: "",
    moq: 1,
    retailPrice: null,
    stockStatus: "for_order",
    leadTime: "",
    imageUrl: "/products/phone-accessories.svg",
    description: "",
    active: true,
    supplierNotes: "",
    internalCostNotes: "",
    adminNotes: "",
    tiers: [],
    variants: [],
  };
}

function slugifyProduct(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

function labelForStock(t: (key: TranslationKey) => string, value: string) {
  return t(stockStatusKeyByValue[value] ?? "forOrder");
}

export function AdminProductsClient({
  initialProducts,
  categories,
  initialError,
}: {
  initialProducts: AdminProductRecord[];
  categories: AdminCategoryOption[];
  initialError?: string;
}) {
  const { t, language } = useAdminI18n();
  const copy = text[language];
  const [products, setProducts] = useState(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<AdminProductRecord | null>(initialProducts[0] ?? null);
  const [editorMode, setEditorMode] = useState<EditorMode>("view");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [imageSize, setImageSize] = useState<"compact" | "normal" | "large">("compact");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(true);
  const [message, setMessage] = useState(initialError ?? "");

  const mainCategories = categories.filter((category) => category.level === 1);
  const categoryProductCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const product of products) {
      for (const categoryId of [product.categoryId, product.subcategoryId, product.childCategoryId]) {
        if (categoryId) {
          counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
        }
      }
    }

    return counts;
  }, [products]);
  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return products.filter((product) => {
      const searchMatch = !needle || product.sku.toLowerCase().includes(needle) || product.name.toLowerCase().includes(needle);
      const categoryMatch =
        categoryFilter === "all" ||
        product.categoryId === categoryFilter ||
        product.subcategoryId === categoryFilter ||
        product.childCategoryId === categoryFilter;
      const stockMatch = stockFilter === "all" || product.stockStatus === stockFilter;
      const activeMatch = activeFilter === "all" || (activeFilter === "active" ? product.active : !product.active);

      return searchMatch && categoryMatch && stockMatch && activeMatch;
    });
  }, [activeFilter, categoryFilter, products, search, stockFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);
  const gridClassByImageSize = {
    compact: "grid gap-3 bg-zinc-50 p-4 sm:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6",
    normal: "grid gap-4 bg-zinc-50 p-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
    large: "grid gap-5 bg-zinc-50 p-4 sm:grid-cols-2 2xl:grid-cols-2 min-[1800px]:grid-cols-3",
  };
  const cardImagePadding = imageSize === "compact" ? "p-2" : imageSize === "large" ? "p-6" : "p-3";

  const startCreate = () => {
    setSelectedProduct(null);
    setEditorMode("create");
  };

  const startEdit = (product: AdminProductRecord) => {
    setSelectedProduct(product);
    setEditorMode("edit");
  };

  const startView = (product: AdminProductRecord) => {
    setSelectedProduct(product);
    setEditorMode("view");
  };

  const toggleVisibility = async (product: AdminProductRecord) => {
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "visibility", active: !product.active }),
    });
    const result = (await response.json().catch(() => ({ ok: false, message: "Update failed." }))) as { ok?: boolean; message?: string };

    if (!response.ok || !result.ok) {
      setMessage(result.message ?? "Update failed.");
      return;
    }

    setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, active: !product.active } : item)));
    setMessage(product.active ? copy.hiddenFromFrontend : "Product is active.");
  };

  const duplicateProduct = async (product: AdminProductRecord) => {
    const response = await fetch(`/api/admin/products/${product.id}/duplicate`, { method: "POST" });
    const result = (await response.json().catch(() => ({ ok: false, message: "Duplicate failed." }))) as { ok?: boolean; message?: string };

    if (!response.ok || !result.ok) {
      setMessage(result.message ?? "Duplicate failed.");
      return;
    }

    window.location.reload();
  };

  const deleteProduct = async (product: AdminProductRecord) => {
    if (!window.confirm(copy.confirmDelete)) {
      return;
    }

    const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const result = (await response.json().catch(() => ({ ok: false, message: "Delete failed." }))) as { ok?: boolean; message?: string };

    if (!response.ok || !result.ok) {
      setMessage(result.message ?? copy.deleteBlocked);
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== product.id));
    setSelectedProduct(null);
    setMessage("Product deleted.");
  };

  const exportProductsCsv = () => {
    const headers = [
      "SKU",
      "Product Name",
      "Category",
      "Subcategory",
      "Child Category",
      "MOQ",
      "Retail Price",
      "Stock Status",
      "Active",
      "Price Range",
      "Image URL",
    ];
    const escapeCell = (value: string | number | boolean) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = filteredProducts.map((product) => [
      product.sku,
      product.name,
      product.category,
      product.subcategory,
      product.childCategory,
      product.moq,
      product.retailPrice ?? "",
      labelForStock(t, product.stockStatus),
      product.active ? "Active" : "Hidden",
      product.priceRange,
      product.image,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `luis-one-products-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    setMessage(`Exported ${filteredProducts.length} products.`);
  };

  return (
    <>
      <AdminPageTitle titleKey="productManagement" />
      {message ? <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-700">{message}</div> : null}
      <div className="mb-4 rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label={t("searchProducts")}
            placeholder={t("searchProducts")}
            className="h-11 rounded-md border border-zinc-200 px-4 text-sm outline-none focus:border-orange-500 xl:w-[420px]"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setFiltersOpen((current) => !current)} className="h-11 rounded-md border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-700">
              {filtersOpen ? "Hide filters" : "Filters"}
            </button>
            <button type="button" onClick={() => setCategoryPanelOpen((current) => !current)} className="h-11 rounded-md border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-700">
              {categoryPanelOpen ? "Hide categories" : "Show categories"}
            </button>
            <button type="button" onClick={startCreate} className="h-11 rounded-md bg-[#f65f18] px-4 text-sm font-black text-white">
              {t("addProduct")}
            </button>
            <Link href="/admin/products/bulk-upload" className="grid h-11 place-items-center rounded-md border border-orange-200 bg-orange-50 px-4 text-sm font-black text-orange-700">
              {t("bulkUpload")}
            </Link>
          </div>
        </div>

        <div className={`mt-4 overflow-hidden rounded-md border border-zinc-100 bg-zinc-50 transition-all ${filtersOpen ? "max-h-80 p-3" : "max-h-0 border-transparent p-0"}`}>
          <div className="flex flex-wrap gap-3">
            <select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1); }} className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none">
              <option value="all">{copy.allCategories}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {"  ".repeat(category.level - 1)}{category.name}{category.active ? "" : " (hidden)"}
                </option>
              ))}
            </select>
            <select value={stockFilter} onChange={(event) => { setStockFilter(event.target.value); setPage(1); }} className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none">
              <option value="all">{copy.allStock}</option>
              {stockStatuses.map((status) => (
                <option key={status} value={status}>{labelForStock(t, status)}</option>
              ))}
            </select>
            <select value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value); setPage(1); }} className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none">
              <option value="all">{copy.allVisibility}</option>
              <option value="active">{t("activeToggle")}</option>
              <option value="hidden">{t("hidden")}</option>
            </select>
            <button type="button" onClick={exportProductsCsv} className="h-11 rounded-md border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-700 hover:border-orange-200 hover:text-orange-700">
              {t("exportCsv")}
            </button>
          </div>
        </div>
      </div>

      <div className={`grid gap-4 ${categoryPanelOpen ? "xl:grid-cols-[280px_1fr]" : "xl:grid-cols-1"}`}>
        {categoryPanelOpen ? (
          <CategoryBrowser
            categories={categories}
            selectedCategoryId={categoryFilter}
            productCounts={categoryProductCounts}
            allCount={products.length}
            labels={imageUploadText[language]}
            onSelect={(categoryId) => {
              setCategoryFilter(categoryId);
              setPage(1);
            }}
          />
        ) : null}

        <TableShell>
          <div className="flex flex-col gap-3 border-b border-zinc-100 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="font-bold text-zinc-600">
              {filteredProducts.length} {t("products")}
            </p>
            <label className="flex items-center gap-2 font-bold text-zinc-600">
              {t("pageSize")}
              <select
                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 bg-white px-4 py-3 text-sm font-bold text-zinc-600">
            <span>{imageUploadText[language].imageSize}</span>
            {(["compact", "normal", "large"] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setImageSize(size)}
                className={`rounded-md px-3 py-1.5 text-xs font-black ${imageSize === size ? "bg-[#f65f18] text-white" : "border border-zinc-200 bg-white text-zinc-700"}`}
              >
                {size === "compact" ? imageUploadText[language].compactImages : size === "large" ? imageUploadText[language].largeImages : imageUploadText[language].normalImages}
              </button>
            ))}
          </div>
          <div className={gridClassByImageSize[imageSize]}>
            {visibleProducts.map((product) => (
              <article key={product.id} className={`group overflow-hidden rounded-lg border bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg ${product.active ? "border-zinc-200" : "border-zinc-300 opacity-75"}`}>
                <div className="relative">
                  <button type="button" onClick={() => startEdit(product)} className={`block aspect-square w-full bg-gradient-to-br from-orange-50 via-white to-zinc-50 ${cardImagePadding}`}>
                    <Image src={product.image} alt={product.name} width={360} height={360} className="h-full w-full object-contain transition duration-200 group-hover:scale-[1.03]" />
                  </button>
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black shadow-sm ${product.active ? "bg-emerald-600 text-white" : "bg-zinc-700 text-white"}`}>
                      {product.active ? t("activeToggle") : t("hidden")}
                    </span>
                    {product.supplierNotes ? <span className="rounded-full bg-orange-600 px-2 py-1 text-[10px] font-black text-white shadow-sm">{t("supplierNotes")}</span> : null}
                  </div>
                  <div className="absolute inset-x-2 bottom-2 grid grid-cols-3 gap-1 opacity-0 transition group-hover:opacity-100">
                    <button type="button" onClick={() => startView(product)} className="rounded-md bg-white/95 px-2 py-1.5 text-[10px] font-black text-zinc-700 shadow-sm">{t("view")}</button>
                    <button type="button" onClick={() => startEdit(product)} className="rounded-md bg-[#f65f18] px-2 py-1.5 text-[10px] font-black text-white shadow-sm">{t("edit")}</button>
                    <button type="button" onClick={() => duplicateProduct(product)} className="rounded-md bg-white/95 px-2 py-1.5 text-[10px] font-black text-zinc-700 shadow-sm">{t("duplicate")}</button>
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-orange-600">{product.sku}</p>
                      <span className="shrink-0 rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-black text-orange-700">MOQ {product.moq}</span>
                    </div>
                    <button type="button" onClick={() => startEdit(product)} className="mt-1 line-clamp-2 min-h-8 text-left text-xs font-black leading-4 text-zinc-950 hover:text-orange-700">{product.name}</button>
                  </div>
                  <p className="line-clamp-1 text-[10px] font-bold text-zinc-500">
                    {[product.category, product.subcategory, product.childCategory].filter(Boolean).join(" > ") || "-"}
                  </p>
                  <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-[#f65f18]">{product.priceRange}</p>
                      {product.retailPrice ? <p className="truncate text-[10px] font-bold text-zinc-500">{t("retailPrice")}: PHP {product.retailPrice.toLocaleString("en-US")}</p> : null}
                      <p className="truncate text-[10px] font-bold text-zinc-500">{labelForStock(t, product.stockStatus)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => toggleVisibility(product)} className="rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-black text-zinc-700">{product.active ? t("hide") : t("unhide")}</button>
                      <button type="button" onClick={() => deleteProduct(product)} className="rounded-md border border-red-200 px-2 py-1 text-[10px] font-black text-red-700">{t("delete")}</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {!visibleProducts.length ? (
              <div className="rounded-md border border-dashed border-zinc-200 bg-white p-6 text-sm font-bold text-zinc-500 sm:col-span-2 2xl:col-span-3 min-[1800px]:col-span-4">
                {copy.noProducts}
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-white px-4 py-3">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`h-9 w-9 rounded-md text-sm font-black ${pageNumber === page ? "bg-[#f65f18] text-white" : "border border-zinc-200 text-zinc-700"}`}
              >
                {pageNumber}
              </button>
            ))}
          </div>
        </TableShell>
      </div>

      <ProductEditor
        key={`${editorMode}-${selectedProduct?.id ?? "new"}`}
        mode={editorMode}
        product={selectedProduct}
        categories={categories}
        mainCategories={mainCategories}
        onMessage={setMessage}
      />
    </>
  );
}

function ProductEditor({
  mode,
  product,
  categories,
  mainCategories,
  onMessage,
}: {
  mode: EditorMode;
  product: AdminProductRecord | null;
  categories: AdminCategoryOption[];
  mainCategories: AdminCategoryOption[];
  onMessage: (message: string) => void;
}) {
  const { t, language } = useAdminI18n();
  const copy = text[language];
  const imageCopy = imageUploadText[language];
  const [activeTab, setActiveTab] = useState<TranslationKey>("basicInfo");
  const [draft, setDraft] = useState<ProductDraft>(product ? productToDraft(product) : blankDraft(categories));
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageStatus, setImageStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [successDialog, setSuccessDialog] = useState("");
  const subcategories = categories.filter((category) => category.parentId === draft.categoryId);
  const childCategories = categories.filter((category) => category.parentId === draft.subcategoryId);
  const disabled = mode === "view";
  const title = mode === "create" ? copy.createProduct : draft.name || t("productEditor");

  const updateDraft = (patch: Partial<ProductDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const updateTier = (index: number, patch: Partial<AdminProductTier>) => {
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.map((tier, tierIndex) => (tierIndex === index ? { ...tier, ...patch } : tier)),
    }));
  };
  const addVariant = () => {
    setDraft((current) => ({
      ...current,
      variants: [
        ...current.variants,
        {
          name: "",
          sku: "",
          model: "",
          fits: "",
          imageUrl: "",
          moq: current.moq || 1,
          stockStatus: current.stockStatus || "for_order",
          leadTime: current.leadTime,
          active: true,
          sortOrder: current.variants.length,
          tiers: current.tiers.length ? current.tiers.map((tier) => ({ ...tier, id: undefined })) : [],
        },
      ],
    }));
  };
  const updateVariant = (index: number, patch: Partial<AdminProductVariant>) => {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => (variantIndex === index ? { ...variant, ...patch } : variant)),
    }));
  };
  const updateVariantTier = (variantIndex: number, tierIndex: number, patch: Partial<AdminProductTier>) => {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, currentVariantIndex) =>
        currentVariantIndex === variantIndex
          ? {
              ...variant,
              tiers: variant.tiers.map((tier, currentTierIndex) => (currentTierIndex === tierIndex ? { ...tier, ...patch } : tier)),
            }
          : variant,
      ),
    }));
  };

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        window.URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const selectImageFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!allowedImageTypes.has(file.type)) {
      onMessage(imageCopy.imageInvalidType);
      setImageStatus(imageCopy.imageInvalidType);
      return;
    }

    if (selectedImagePreview) {
      window.URL.revokeObjectURL(selectedImagePreview);
    }

    setImageStatus("Optimizing image...");

    try {
      const prepared = await prepareAdminUploadImage(file);
      setSelectedImage(prepared.file);
      setSelectedImagePreview(window.URL.createObjectURL(prepared.file));
      setImageStatus(
        prepared.compressed
          ? `Image optimized from ${formatImageBytes(prepared.originalBytes)} to ${formatImageBytes(prepared.file.size)}. Click Save Product or Upload Image Now.`
          : `${file.name} selected. Click Save Product or Upload Image Now.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : imageCopy.imageTooLarge;
      onMessage(message);
      setImageStatus(message);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      onMessage(imageCopy.imageInvalidType);
      setImageStatus(imageCopy.imageInvalidType);
      return "";
    }

    setUploadingImage(true);
    setImageStatus("Uploading image...");

    try {
      const formData = new FormData();
      formData.append("file", selectedImage);
      formData.append("sku", draft.sku || draft.slug || draft.name || "new-product");

      const response = await fetch("/api/admin/products/image-upload", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => ({ ok: false, message: imageCopy.imageUploadFailed }))) as {
        ok?: boolean;
        message?: string;
        imageUrl?: string;
      };

      if (!response.ok || !result.ok || !result.imageUrl) {
        onMessage(result.message ?? imageCopy.imageUploadFailed);
        setImageStatus(result.message ?? imageCopy.imageUploadFailed);
        return "";
      }

      updateDraft({ imageUrl: result.imageUrl });
      setSelectedImage(null);
      if (selectedImagePreview) {
        window.URL.revokeObjectURL(selectedImagePreview);
      }
      setSelectedImagePreview("");
      onMessage(imageCopy.imageUploadSuccess);
      setImageStatus(imageCopy.imageUploadSuccess);
      return result.imageUrl;
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadVariantImage = async (variantIndex: number, file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!allowedImageTypes.has(file.type)) {
      onMessage(imageCopy.imageInvalidType);
      return;
    }

    let uploadFile = file;

    try {
      const prepared = await prepareAdminUploadImage(file);
      uploadFile = prepared.file;
      if (prepared.compressed) {
        onMessage(`Variant image optimized from ${formatImageBytes(prepared.originalBytes)} to ${formatImageBytes(prepared.file.size)}.`);
      }
    } catch (error) {
      onMessage(error instanceof Error ? error.message : imageCopy.imageTooLarge);
      return;
    }

    const variant = draft.variants[variantIndex];
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("sku", variant.sku || draft.sku || draft.slug || "product-variant");

    const response = await fetch("/api/admin/products/image-upload", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json().catch(() => ({ ok: false, message: imageCopy.imageUploadFailed }))) as {
      ok?: boolean;
      message?: string;
      imageUrl?: string;
    };

    if (!response.ok || !result.ok || !result.imageUrl) {
      onMessage(result.message ?? imageCopy.imageUploadFailed);
      return;
    }

    updateVariant(variantIndex, { imageUrl: result.imageUrl });
    onMessage(imageCopy.imageUploadSuccess);
  };

  const submit = async () => {
    setSaving(true);
    onMessage("");

    try {
      const payload: ProductDraft = {
        ...draft,
        slug: draft.slug || slugifyProduct(draft.name || draft.sku),
      };

      if (selectedImage) {
        const uploadedImageUrl = await uploadImage();

        if (!uploadedImageUrl) {
          return;
        }

        payload.imageUrl = uploadedImageUrl;
      }

    const endpoint = mode === "create" ? "/api/admin/products" : `/api/admin/products/${draft.id}`;
    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => ({ ok: false, message: "Save failed." }))) as { ok?: boolean; message?: string };

    if (!response.ok || !result.ok) {
      onMessage(result.message ?? "Save failed.");
      return;
    }

    const successMessage = mode === "create" ? "Product uploaded successfully." : "Product saved successfully.";
    setSuccessDialog(successMessage);
    onMessage(successMessage);

    window.setTimeout(() => {
      window.location.reload();
    }, 1200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-5 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">{t("productEditor")}</p>
          <h2 className="mt-1 text-xl font-black text-zinc-950">{title}</h2>
          <p className="mt-1 text-sm font-bold text-zinc-500">{copy.formHint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="orange">{t("noAutomaticPricing")}</StatusPill>
          {mode !== "view" ? (
            <button type="button" onClick={() => void submit()} disabled={saving || uploadingImage} className="rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">
              {saving ? "Saving..." : mode === "create" ? copy.createProduct : copy.saveProduct}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-b border-zinc-100 pb-4 sm:grid-cols-2 xl:grid-cols-6">
        {productTabs.map((tab) => {
          const badge = tab === "wholesalePricesTab" ? draft.tiers.length : tab === "variantsTab" ? draft.variants.length : null;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md border px-4 py-3 text-left text-sm font-black transition ${
                activeTab === tab
                  ? "border-[#f65f18] bg-[#f65f18] text-white shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-200 hover:bg-orange-50"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span>{t(tab)}</span>
                {badge !== null ? (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === tab ? "bg-white/20 text-white" : "bg-orange-50 text-orange-700"}`}>{badge}</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {activeTab === "basicInfo" ? (
          <div className="space-y-5">
            <section className="rounded-md border border-zinc-200 bg-zinc-50/60 p-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Input label={t("sku")} value={draft.sku} onChange={(value) => updateDraft({ sku: value })} disabled={disabled} />
                <Input label={t("productName")} value={draft.name} onChange={(value) => updateDraft({ name: value })} disabled={disabled} />
                <CategorySelect label={t("category")} value={draft.categoryId} categories={mainCategories} disabled={disabled} onChange={(value) => updateDraft({ categoryId: value, subcategoryId: "", childCategoryId: "" })} />
                <CategorySelect label={t("subcategory")} value={draft.subcategoryId} categories={subcategories} disabled={disabled} onChange={(value) => updateDraft({ subcategoryId: value, childCategoryId: "" })} optional />
                <CategorySelect label={t("childCategory")} value={draft.childCategoryId} categories={childCategories} disabled={disabled} onChange={(value) => updateDraft({ childCategoryId: value })} optional />
                <Input label={t("moq")} type="number" value={String(draft.moq)} onChange={(value) => updateDraft({ moq: Number(value) || 1 })} disabled={disabled} />
                <Input
                  label={t("retailPrice")}
                  type="number"
                  value={draft.retailPrice === null ? "" : String(draft.retailPrice)}
                  onChange={(value) => updateDraft({ retailPrice: value === "" ? null : Number(value) || null })}
                  disabled={disabled}
                />
                <label className="text-sm font-bold text-zinc-700">
                  {t("stockStatus")}
                  <select disabled={disabled} value={draft.stockStatus} onChange={(event) => updateDraft({ stockStatus: event.target.value })} className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700">
                    {stockStatuses.map((status) => <option key={status} value={status}>{labelForStock(t, status)}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-700">
                  <input type="checkbox" checked={draft.active} disabled={disabled} onChange={(event) => updateDraft({ active: event.target.checked })} className="h-4 w-4 accent-[#f65f18]" />
                  {draft.active ? t("activeToggle") : t("hidden")}
                </label>
                <Textarea label={t("description")} value={draft.description} onChange={(value) => updateDraft({ description: value })} disabled={disabled} wide />
              </div>
            </section>

            <details className="rounded-md border border-zinc-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-black text-zinc-800">
                Slug / {t("brand")} / {t("model")} / {t("leadTime")}
              </summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Input label="Slug" value={draft.slug} onChange={(value) => updateDraft({ slug: value })} disabled={disabled} />
                <Input label={t("brand")} value={draft.brand} onChange={(value) => updateDraft({ brand: value })} disabled={disabled} />
                <Input label={t("model")} value={draft.model} onChange={(value) => updateDraft({ model: value })} disabled={disabled} />
                <Input label={t("leadTime")} value={draft.leadTime} onChange={(value) => updateDraft({ leadTime: value })} disabled={disabled} />
              </div>
            </details>
          </div>
        ) : null}

        {activeTab === "wholesalePricesTab" ? (
          <WholesalePriceEditor
            disabled={disabled}
            tiers={draft.tiers}
            t={t}
            maxQtyBlank={copy.maxQtyBlank}
            addTierLabel={copy.addTier}
            onUpdateTier={updateTier}
            onDeleteTier={(index) => updateDraft({ tiers: draft.tiers.filter((_, tierIndex) => tierIndex !== index) })}
            onAddTier={() => updateDraft({ tiers: [...draft.tiers, { minQty: 1, maxQty: null, unitPrice: 1 }] })}
          />
        ) : null}

        {activeTab === "variantsTab" ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-md border border-orange-100 bg-orange-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-black text-zinc-950">{t("variantsTab")}</h3>
                <p className="mt-1 text-sm font-bold text-orange-700">
                  Use variants when one product has multiple models, fitments, images, MOQ, stock, or prices.
                </p>
              </div>
              <button type="button" disabled={disabled} onClick={addVariant} className="rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white disabled:opacity-40">
                {t("addVariant")}
              </button>
            </div>
            {!draft.variants.length ? (
              <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm font-bold text-zinc-500">
                No variants yet. Products without variants still use the main product price tiers.
              </div>
            ) : null}
            {draft.variants.map((variant, variantIndex) => (
              <section key={variant.id ?? variantIndex} className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">
                      {t("variantsTab")} #{variantIndex + 1}
                    </p>
                    <h4 className="text-lg font-black text-zinc-950">{variant.name || t("variantName")}</h4>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => updateDraft({ variants: draft.variants.filter((_, index) => index !== variantIndex) })}
                    className="rounded-md border border-red-200 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-40"
                  >
                    {t("deleteVariant")}
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Input label={t("variantName")} value={variant.name} onChange={(value) => updateVariant(variantIndex, { name: value })} disabled={disabled} />
                  <Input label={t("variantSku")} value={variant.sku} onChange={(value) => updateVariant(variantIndex, { sku: value })} disabled={disabled} />
                  <Input label={t("model")} value={variant.model} onChange={(value) => updateVariant(variantIndex, { model: value })} disabled={disabled} />
                  <Input label={t("fits")} value={variant.fits} onChange={(value) => updateVariant(variantIndex, { fits: value })} disabled={disabled} />
                  <Input label={t("moq")} type="number" value={String(variant.moq)} onChange={(value) => updateVariant(variantIndex, { moq: Number(value) || 1 })} disabled={disabled} />
                  <label className="text-sm font-bold text-zinc-700">
                    {t("stockStatus")}
                    <select disabled={disabled} value={variant.stockStatus} onChange={(event) => updateVariant(variantIndex, { stockStatus: event.target.value })} className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
                      {stockStatuses.map((status) => <option key={status} value={status}>{labelForStock(t, status)}</option>)}
                    </select>
                  </label>
                  <Input label={t("leadTime")} value={variant.leadTime} onChange={(value) => updateVariant(variantIndex, { leadTime: value })} disabled={disabled} />
                  <Input label={t("sortOrder")} type="number" value={String(variant.sortOrder)} onChange={(value) => updateVariant(variantIndex, { sortOrder: Number(value) || 0 })} disabled={disabled} />
                  <label className="flex items-center gap-3 text-sm font-bold text-zinc-700">
                    <input type="checkbox" checked={variant.active} disabled={disabled} onChange={(event) => updateVariant(variantIndex, { active: event.target.checked })} className="h-4 w-4 accent-[#f65f18]" />
                    {variant.active ? t("activeToggle") : t("hidden")}
                  </label>
                  <Input label={`${t("imageUrl")} (${t("variantsTab")})`} value={variant.imageUrl} onChange={(value) => updateVariant(variantIndex, { imageUrl: value })} disabled={disabled} />
                  <label className="text-sm font-bold text-zinc-700">
                    {imageCopy.uploadImage}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={disabled}
                      onChange={(event) => void uploadVariantImage(variantIndex, event.target.files?.[0])}
                      className="mt-2 block w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-orange-100 file:px-3 file:py-2 file:text-sm file:font-black file:text-orange-700 disabled:opacity-50"
                    />
                  </label>
                </div>
                <p className="mt-3 text-xs font-bold text-zinc-500">Variant image URL overrides the main product image after customer selection.</p>
                <div className="mt-4">
                  <WholesalePriceEditor
                    disabled={disabled}
                    tiers={variant.tiers}
                    t={t}
                    maxQtyBlank={copy.maxQtyBlank}
                    addTierLabel={copy.addTier}
                    onUpdateTier={(tierIndex, patch) => updateVariantTier(variantIndex, tierIndex, patch)}
                    onDeleteTier={(tierIndex) => updateVariant(variantIndex, { tiers: variant.tiers.filter((_, index) => index !== tierIndex) })}
                    onAddTier={() => updateVariant(variantIndex, { tiers: [...variant.tiers, { minQty: 1, maxQty: null, unitPrice: 1 }] })}
                  />
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {activeTab === "imagesTab" ? (
          <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-start">
            <div>
              <p className="mb-2 text-sm font-black text-zinc-700">{imageCopy.imagePreview}</p>
              <div
                role="img"
                aria-label={draft.name || "Product"}
                className="aspect-square rounded-md border border-orange-100 bg-orange-50 bg-contain bg-center bg-no-repeat p-4"
                style={{ backgroundImage: `url("${selectedImagePreview || draft.imageUrl || "/products/phone-accessories.svg"}")` }}
              />
            </div>
            <div className="space-y-4">
              <p className="rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
                {imageCopy.imageUploadHint}
              </p>
              <label className="block text-sm font-bold text-zinc-700">
                {imageCopy.selectedImage}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={disabled}
                  onChange={(event) => void selectImageFile(event.target.files?.[0])}
                  className="mt-2 block w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-orange-100 file:px-3 file:py-2 file:text-sm file:font-black file:text-orange-700 disabled:opacity-50"
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={disabled || !selectedImage || uploadingImage}
                  onClick={() => void uploadImage()}
                  className="rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white disabled:opacity-40"
                >
                  {uploadingImage ? "Uploading..." : draft.imageUrl ? imageCopy.replaceImage : "Upload Image Now"}
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    updateDraft({ imageUrl: "" });
                    setSelectedImage(null);
                    if (selectedImagePreview) {
                      window.URL.revokeObjectURL(selectedImagePreview);
                    }
                    setSelectedImagePreview("");
                  }}
                  className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700 disabled:opacity-40"
                >
                  {imageCopy.removeImage}
                </button>
              </div>
              {imageStatus ? <p className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-600">{imageStatus}</p> : null}
              <Input label={t("imageUrl")} value={draft.imageUrl} onChange={(value) => updateDraft({ imageUrl: value })} disabled={disabled} />
            </div>
          </div>
        ) : null}

        {activeTab === "supplierNotesTab" ? (
          <div>
            <p className="mb-4 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">{t("supplierNotesAdminOnly")}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Textarea label={t("supplierNotes")} value={draft.supplierNotes} onChange={(value) => updateDraft({ supplierNotes: value })} disabled={disabled} />
              <Textarea label={t("internalCostNotes")} value={draft.internalCostNotes} onChange={(value) => updateDraft({ internalCostNotes: value })} disabled={disabled} />
            </div>
          </div>
        ) : null}

        {activeTab === "adminNotesTab" ? <Textarea label={t("adminNotes")} value={draft.adminNotes} onChange={(value) => updateDraft({ adminNotes: value })} disabled={disabled} /> : null}
      </div>
      {mode !== "view" ? (
        <div className="sticky bottom-0 z-20 mt-6 -mx-5 -mb-5 border-t border-zinc-200 bg-white/95 px-5 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-zinc-500">
              {selectedImage ? "Selected image will upload automatically when you save." : "Review product details, prices, images, and variants before saving."}
            </p>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={saving || uploadingImage}
              className="h-11 rounded-md bg-[#f65f18] px-6 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? "Saving..." : mode === "create" ? copy.createProduct : copy.saveProduct}
            </button>
          </div>
        </div>
      ) : null}
      {successDialog ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-zinc-950/45 px-4">
          <div className="w-full max-w-sm rounded-md border border-orange-100 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-orange-600 text-sm font-black text-white">OK</div>
            <h3 className="mt-4 text-lg font-black text-zinc-950">{successDialog}</h3>
            <p className="mt-2 text-sm font-bold text-zinc-500">Refreshing product list...</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 h-10 rounded-md bg-[#f65f18] px-5 text-sm font-black text-white"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CategoryBrowser({
  categories,
  selectedCategoryId,
  productCounts,
  allCount,
  labels,
  onSelect,
}: {
  categories: AdminCategoryOption[];
  selectedCategoryId: string;
  productCounts: Map<string, number>;
  allCount: number;
  labels: typeof imageUploadText.en;
  onSelect: (categoryId: string) => void;
}) {
  const mainCategories = useMemo(() => categories.filter((category) => category.level === 1), [categories]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(mainCategories.map((category) => category.id)));

  const toggleExpanded = (categoryId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <aside className="rounded-md border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">{labels.categoryBrowser}</p>
      </div>
      <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-3">
        <button
          type="button"
          onClick={() => onSelect("all")}
          className={`mb-2 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-black ${selectedCategoryId === "all" ? "bg-[#f65f18] text-white" : "bg-zinc-50 text-zinc-800 hover:bg-orange-50 hover:text-orange-700"}`}
        >
          <span>{labels.allProducts}</span>
          <span className="text-xs">{allCount}</span>
        </button>
        <div className="space-y-1">
          {mainCategories.map((category) => (
            <CategoryBrowserNode
              key={category.id}
              category={category}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              productCounts={productCounts}
              expandedIds={expandedIds}
              labels={labels}
              onToggleExpanded={toggleExpanded}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function CategoryBrowserNode({
  category,
  categories,
  selectedCategoryId,
  productCounts,
  expandedIds,
  labels,
  onToggleExpanded,
  onSelect,
}: {
  category: AdminCategoryOption;
  categories: AdminCategoryOption[];
  selectedCategoryId: string;
  productCounts: Map<string, number>;
  expandedIds: Set<string>;
  labels: typeof imageUploadText.en;
  onToggleExpanded: (categoryId: string) => void;
  onSelect: (categoryId: string) => void;
}) {
  const children = categories.filter((item) => item.parentId === category.id);
  const active = selectedCategoryId === category.id;
  const count = productCounts.get(category.id) ?? 0;
  const expanded = expandedIds.has(category.id);
  const indentByLevel = category.level === 1 ? "" : category.level === 2 ? "ml-4" : "ml-8";

  return (
    <div className={indentByLevel}>
      <div className={`flex w-full items-center rounded-md pr-2 text-sm font-bold ${active ? "bg-orange-100 text-orange-700" : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"}`}>
        <button
          type="button"
          onClick={() => onToggleExpanded(category.id)}
          disabled={!children.length}
          aria-label={expanded ? "Collapse category" : "Expand category"}
          className={`grid h-9 w-8 shrink-0 place-items-center rounded-md text-xs font-black ${children.length ? "text-orange-600 hover:bg-orange-50" : "text-transparent"}`}
        >
          {children.length ? (expanded ? "-" : "+") : "-"}
        </button>
        <button type="button" onClick={() => onSelect(category.id)} className="min-w-0 flex-1 py-2 text-left">
          <span className="line-clamp-1">{category.name}{category.active ? "" : " (hidden)"}</span>
        </button>
        <span className="ml-2 shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs font-black text-zinc-600">
          {count}
        </span>
      </div>
      {children.length && expanded ? (
        <div className="mt-1 space-y-1">
          {children.map((child) => (
            <CategoryBrowserNode
              key={child.id}
              category={child}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              productCounts={productCounts}
              expandedIds={expandedIds}
              labels={labels}
              onToggleExpanded={onToggleExpanded}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function WholesalePriceEditor({
  disabled,
  tiers,
  t,
  maxQtyBlank,
  addTierLabel,
  onUpdateTier,
  onDeleteTier,
  onAddTier,
}: {
  disabled: boolean;
  tiers: AdminProductTier[];
  t: (key: TranslationKey) => string;
  maxQtyBlank: string;
  addTierLabel: string;
  onUpdateTier: (index: number, patch: Partial<AdminProductTier>) => void;
  onDeleteTier: (index: number) => void;
  onAddTier: () => void;
}) {
  return (
    <section className="rounded-md border border-orange-100 bg-orange-50/40 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-black text-zinc-950">{t("wholesalePricesTab")}</h3>
          <p className="text-sm font-bold text-orange-700">{t("noAutomaticPricing")}</p>
        </div>
        <button type="button" disabled={disabled} onClick={onAddTier} className="rounded-md border border-orange-200 bg-white px-4 py-2 text-sm font-black text-orange-700 disabled:opacity-40">
          {addTierLabel}
        </button>
      </div>
      {tiers.length ? (
        <div className="overflow-x-auto rounded-md border border-orange-100 bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-orange-50 text-xs uppercase tracking-[0.14em] text-orange-700">
              <tr>
                <th className="px-4 py-3">min_qty</th>
                <th className="px-4 py-3">max_qty</th>
                <th className="px-4 py-3">unit_price</th>
                <th className="px-4 py-3">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100">
              {tiers.map((tier, index) => (
                <tr key={index}>
                  <td className="px-4 py-3"><SmallNumber value={tier.minQty} disabled={disabled} onChange={(value) => onUpdateTier(index, { minQty: value })} /></td>
                  <td className="px-4 py-3"><SmallNumber value={tier.maxQty ?? ""} disabled={disabled} placeholder={maxQtyBlank} onChange={(value) => onUpdateTier(index, { maxQty: value || null })} /></td>
                  <td className="px-4 py-3"><SmallNumber value={tier.unitPrice} disabled={disabled} onChange={(value) => onUpdateTier(index, { unitPrice: value })} /></td>
                  <td className="px-4 py-3">
                    <button type="button" disabled={disabled} onClick={() => onDeleteTier(index)} className="rounded-md border border-red-200 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-40">
                      {t("delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-orange-200 bg-white p-6 text-sm font-bold text-zinc-500">
          No wholesale price tiers yet. Click Add Tier to create only the price levels you need.
        </div>
      )}
    </section>
  );
}

function Input({ label, value, onChange, disabled, type = "text" }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; type?: string }) {
  return (
    <label className="text-sm font-bold text-zinc-700">
      {label}
      <input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 disabled:text-zinc-500" />
    </label>
  );
}

function Textarea({ label, value, onChange, disabled, wide }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; wide?: boolean }) {
  return (
    <label className={`block text-sm font-bold text-zinc-700 ${wide ? "md:col-span-2 xl:col-span-4" : ""}`}>
      {label}
      <textarea value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-28 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 disabled:text-zinc-500" />
    </label>
  );
}

function CategorySelect({
  label,
  value,
  categories,
  onChange,
  disabled,
  optional,
}: {
  label: string;
  value: string;
  categories: AdminCategoryOption[];
  onChange: (value: string) => void;
  disabled: boolean;
  optional?: boolean;
}) {
  return (
    <label className="text-sm font-bold text-zinc-700">
      {label}
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
        {optional ? <option value="">-</option> : null}
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}{category.active ? "" : " (hidden)"}</option>
        ))}
      </select>
    </label>
  );
}

function SmallNumber({ value, onChange, disabled, placeholder }: { value: number | ""; onChange: (value: number) => void; disabled: boolean; placeholder?: string }) {
  return (
    <input
      type="number"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))}
      className="h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700"
    />
  );
}
