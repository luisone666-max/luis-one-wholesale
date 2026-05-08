"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
type ProductsListResponse = {
  ok?: boolean;
  message?: string;
  products?: AdminProductRecord[];
  categories?: AdminCategoryOption[];
};

const defaultPageSize = 24;
const stockStatuses = ["ready_stock", "for_order", "low_stock", "unavailable"];
const productTabs: TranslationKey[] = ["basicInfo", "imagesTab", "wholesalePricesTab", "variantsTab", "supplierNotesTab", "adminNotesTab"];
const bulkUploadTemplateHeaders = [
  "SKU",
  "Product Name",
  "Category",
  "Subcategory",
  "Child Category",
  "Brand",
  "Model",
  "MOQ",
  "Retail Price",
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
const bulkUploadTemplateSample = [
  "BULK-001",
  "Sample Wholesale Product",
  "Motorcycle Parts",
  "Honda Click",
  "Seat",
  "Sample Brand",
  "Universal",
  "1",
  "180",
  "for_order",
  "3-7 days",
  "/products/flat-seat.svg",
  "Sample CSV product description.",
  "135",
  "125",
  "118",
  "110",
  "Admin-only supplier note",
  "Admin-only cost note",
  "true",
];

const text = {
  en: {
    addTier: "Add Tier",
    maxQtyBlank: "Leave blank for 50+ tier",
    saveProduct: "Save Product",
    createProduct: "Save / Upload Product",
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
    downloadTemplate: "Download Upload Template",
    templateDownloaded: "Bulk upload CSV template downloaded.",
    workflowTitle: "Product upload flow",
    workflowBasic: "Basic info",
    workflowPrice: "Price",
    workflowImage: "Image",
    workflowOptional: "Optional",
    workflowReady: "Ready",
    workflowMissing: "Needs attention",
    workflowHint: "Start with SKU, name, category, MOQ, retail price, and at least one wholesale tier. Add images and variants only when needed.",
    saveAndAddAnother: "Save and Add Another",
    closeToList: "Back to Product List",
    addAnotherReady: "Ready for the next product.",
    closeEditor: "Close",
    saving: "Saving...",
    productListUpdated: "Product list updated.",
    selectedImageSaveHint: "Selected image will upload automatically when you save.",
    reviewBeforeSaving: "Review product details, prices, images, and variants before saving.",
  },
  zh: {
    addTier: "\u65b0\u589e\u4ef7\u683c\u9636\u68af",
    maxQtyBlank: "\u7559\u7a7a\u8868\u793a 50+ \u9636\u68af",
    saveProduct: "\u4fdd\u5b58\u5546\u54c1",
    createProduct: "\u4fdd\u5b58\u5e76\u4e0a\u4f20\u5546\u54c1",
    formHint: "\u4f9b\u5e94\u5546\u5907\u6ce8\u548c\u6210\u672c\u5907\u6ce8\u4ec5\u540e\u53f0\u53ef\u89c1\u3002",
    allCategories: "\u5168\u90e8\u5206\u7c7b",
    allStock: "\u5168\u90e8\u5e93\u5b58\u72b6\u6001",
    allVisibility: "\u5168\u90e8\u4e0a\u67b6 / \u9690\u85cf",
    noProducts: "\u6ca1\u6709\u627e\u5230\u5546\u54c1\u3002",
    confirmDelete: "\u786e\u5b9a\u5220\u9664\u8fd9\u4e2a\u5546\u54c1\uff1f",
    duplicateDone: "\u5546\u54c1\u5df2\u590d\u5236\u3002",
    hiddenFromFrontend: "\u9690\u85cf\u5546\u54c1\u4e0d\u4f1a\u663e\u793a\u5728\u5ba2\u6237\u524d\u53f0\u3002",
    deleteBlocked: "\u5982\u679c\u5546\u54c1\u6709\u8ba2\u5355\u5386\u53f2\uff0c\u8bf7\u9690\u85cf\u5546\u54c1\uff0c\u4e0d\u8981\u5220\u9664\u3002",
    downloadTemplate: "\u4e0b\u8f7d\u6279\u91cf\u4e0a\u4f20\u6a21\u677f",
    templateDownloaded: "\u6279\u91cf\u4e0a\u4f20 CSV \u6a21\u677f\u5df2\u4e0b\u8f7d\u3002",
    workflowTitle: "上品流程",
    workflowBasic: "基础资料",
    workflowPrice: "价格",
    workflowImage: "图片",
    workflowOptional: "可选",
    workflowReady: "已完成",
    workflowMissing: "需要补充",
    workflowHint: "先填 SKU、名称、分类、MOQ、零售价和至少一条批发价。图片和变体需要时再加。",
    saveAndAddAnother: "保存后继续新增",
    closeToList: "返回商品列表",
    addAnotherReady: "可以继续上传下一款商品。",
    closeEditor: "关闭",
    saving: "保存中...",
    productListUpdated: "商品列表已更新。",
    selectedImageSaveHint: "已选择的图片会在保存商品时自动上传。",
    reviewBeforeSaving: "保存前请检查商品资料、价格、图片和变体。",
  },
};

const productTextZh = {
  addTier: "新增价格阶梯",
  maxQtyBlank: "留空表示 50+ 阶梯",
  saveProduct: "保存商品",
  createProduct: "保存并上传商品",
  formHint: "供应商备注和成本备注仅后台可见。",
  allCategories: "全部分类",
  allStock: "全部库存状态",
  allVisibility: "全部上架 / 隐藏",
  noProducts: "没有找到商品。",
  confirmDelete: "确定删除这个商品？",
  duplicateDone: "商品已复制。",
  hiddenFromFrontend: "隐藏商品不会显示在客户前台。",
  deleteBlocked: "如果商品有订单历史，请隐藏商品，不要删除。",
  imageUploadHint: "上传 JPG、PNG 或 WebP 图片，最大 2MB。上传后的 URL 会在保存商品时写入。",
  chooseImage: "选择图片",
  uploadImage: "上传图片",
  replaceImage: "替换图片",
  removeImage: "移除图片",
  selectedImage: "已选图片",
  imagePreview: "图片预览",
  imageTooLarge: "图片不能超过 2MB。",
  imageInvalidType: "只允许 JPG、PNG、WebP 图片。",
  imageUploadSuccess: "图片已上传。请保存商品以保留这张图片。",
  imageUploadFailed: "图片上传失败。",
  productUploadSuccess: "商品上传成功。",
  productUpdateSuccess: "商品保存成功。",
  categoryBrowser: "分类浏览",
  allProducts: "全部商品",
  productCountLabel: "个商品",
  imageSize: "图片大小",
  compactImages: "紧凑",
  normalImages: "标准",
  largeImages: "大图",
  variantsHint: "一个商品有多个型号、适配车型、图片、MOQ、库存或价格时，再使用变体。",
  noVariants: "还没有变体。没有变体的商品会使用主商品批发价。",
  variantImageHint: "客户选择变体后，变体图片会替代主商品图片。",
  downloadTemplate: "下载批量上传模板",
  templateDownloaded: "批量上传 CSV 模板已下载。",
  workflowTitle: "上品流程",
  workflowBasic: "基础资料",
  workflowPrice: "价格",
  workflowImage: "图片",
  workflowOptional: "可选",
  workflowReady: "已完成",
  workflowMissing: "需要补充",
  workflowHint: "先填 SKU、名称、分类、MOQ、零售价和至少一条批发价。图片和变体需要时再加。",
  saveAndAddAnother: "保存后继续新增",
  closeToList: "返回商品列表",
  addAnotherReady: "可以继续上传下一款商品。",
  closeEditor: "关闭",
  saving: "保存中...",
  productListUpdated: "商品列表已更新。",
  selectedImageSaveHint: "已选择的图片会在保存商品时自动上传。",
  reviewBeforeSaving: "保存前请检查商品资料、价格、图片和变体。",
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
    variantImageFallback: "No dedicated variant image yet. This variant uses the main product image until you upload one.",
  },
  zh: {
    imageUploadHint: "\u4e0a\u4f20 JPG\u3001PNG \u6216 WebP \u56fe\u7247\uff0c\u6700\u5927 2MB\u3002\u4e0a\u4f20\u540e\u7684 URL \u4f1a\u5728\u4fdd\u5b58\u5546\u54c1\u65f6\u5199\u5165\u3002",
    chooseImage: "\u9009\u62e9\u56fe\u7247",
    uploadImage: "\u4e0a\u4f20\u56fe\u7247",
    replaceImage: "\u66ff\u6362\u56fe\u7247",
    removeImage: "\u79fb\u9664\u56fe\u7247",
    selectedImage: "\u5df2\u9009\u56fe\u7247",
    imagePreview: "\u56fe\u7247\u9884\u89c8",
    imageTooLarge: "\u56fe\u7247\u4e0d\u80fd\u8d85\u8fc7 2MB\u3002",
    imageInvalidType: "\u53ea\u5141\u8bb8 JPG\u3001PNG\u3001WebP \u56fe\u7247\u3002",
    imageUploadSuccess: "\u56fe\u7247\u5df2\u4e0a\u4f20\u3002\u8bf7\u4fdd\u5b58\u5546\u54c1\u4ee5\u4fdd\u7559\u8fd9\u5f20\u56fe\u7247\u3002",
    imageUploadFailed: "\u56fe\u7247\u4e0a\u4f20\u5931\u8d25\u3002",
    categoryBrowser: "\u5206\u7c7b\u6d4f\u89c8",
    allProducts: "\u5168\u90e8\u5546\u54c1",
    productCountLabel: "\u4e2a\u5546\u54c1",
    imageSize: "\u56fe\u7247\u5927\u5c0f",
    compactImages: "\u7d27\u51d1",
    normalImages: "\u6807\u51c6",
    largeImages: "\u5927\u56fe",
    variantImageFallback: "\u8fd9\u4e2a\u53d8\u4f53\u8fd8\u6ca1\u6709\u72ec\u7acb\u56fe\u7247\uff0c\u4f1a\u5148\u4f7f\u7528\u4e3b\u5546\u54c1\u56fe\u7247\u3002",
  },
};

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
type ProductAttentionFilter = "all" | "unavailable" | "low_stock" | "missing_image" | "hidden";
type ProductEditorStep = {
  tab: TranslationKey;
  label: string;
  status: string;
  ready: boolean;
  optional?: boolean;
};

const inventoryWatchText = {
  en: {
    title: "Inventory Watch",
    all: "All",
    unavailable: "Unavailable",
    lowStock: "Low Stock",
    missingImage: "Needs Image",
    hidden: "Hidden",
    inquiryOnly: "Inquiry only",
    noImage: "Needs image",
  },
  zh: {
    title: "\u5e93\u5b58\u5de1\u68c0",
    all: "\u5168\u90e8",
    unavailable: "\u65e0\u8d27",
    lowStock: "\u4f4e\u5e93\u5b58",
    missingImage: "\u5f85\u8865\u56fe",
    hidden: "\u9690\u85cf",
    inquiryOnly: "\u53ea\u80fd\u8be2\u95ee",
    noImage: "\u5f85\u8865\u56fe",
  },
};

const editorFlowText = {
  en: {
    workflowTitle: "Product upload flow",
    workflowHint: "Fill the required steps first. Add photos, variants, and notes only when the product needs them.",
    basicLabel: "Basic info",
    priceLabel: "Wholesale prices",
    imageLabel: "Product image",
    variantsLabel: "Variants",
    requiredStep: "Required",
    optionalStep: "Optional",
    readyStep: "Done",
    clickToEdit: "Click to edit",
    fixRequiredStep: "Fix required step",
    saveReady: "Ready to save. Review details, prices, images, and variants before saving.",
    saveNeedsWork: "Required before saving: SKU, name, category, MOQ, and at least one wholesale price tier.",
    saveUploadButton: "Save / Upload Product",
    saveChangesButton: "Save Changes",
    saving: "Saving...",
    priceEmptyHint: "No wholesale tiers yet. Click Add Tier and add only the price levels this product needs.",
    variantPriceEmptyHint: "No variant tiers yet. Add variant tiers only if this variant uses different prices.",
  },
  zh: {
    workflowTitle: "\u4e0a\u54c1\u6d41\u7a0b",
    workflowHint: "\u5148\u628a\u5fc5\u586b\u6b65\u9aa4\u586b\u5b8c\uff0c\u56fe\u7247\u3001\u53d8\u4f53\u548c\u5907\u6ce8\u9700\u8981\u65f6\u518d\u52a0\u3002",
    basicLabel: "\u57fa\u7840\u8d44\u6599",
    priceLabel: "\u6279\u53d1\u4ef7",
    imageLabel: "\u5546\u54c1\u56fe\u7247",
    variantsLabel: "\u53d8\u4f53",
    requiredStep: "\u5fc5\u586b",
    optionalStep: "\u53ef\u9009",
    readyStep: "\u5df2\u5b8c\u6210",
    clickToEdit: "\u70b9\u51fb\u7f16\u8f91",
    fixRequiredStep: "\u8865\u9f50\u5fc5\u586b\u6b65\u9aa4",
    saveReady: "\u53ef\u4ee5\u4fdd\u5b58\u3002\u4fdd\u5b58\u524d\u518d\u68c0\u67e5\u8d44\u6599\u3001\u4ef7\u683c\u3001\u56fe\u7247\u548c\u53d8\u4f53\u3002",
    saveNeedsWork: "\u4fdd\u5b58\u524d\u5fc5\u586b\uff1aSKU\u3001\u5546\u54c1\u540d\u3001\u5206\u7c7b\u3001MOQ\uff0c\u4ee5\u53ca\u81f3\u5c11\u4e00\u6761\u6279\u53d1\u4ef7\u3002",
    saveUploadButton: "\u4fdd\u5b58 / \u4e0a\u4f20\u5546\u54c1",
    saveChangesButton: "\u4fdd\u5b58\u4fee\u6539",
    saving: "\u4fdd\u5b58\u4e2d...",
    priceEmptyHint: "\u8fd8\u6ca1\u6709\u6279\u53d1\u4ef7\u3002\u70b9\u51fb\u65b0\u589e\u9636\u68af\uff0c\u53ea\u6dfb\u52a0\u8fd9\u4e2a\u5546\u54c1\u9700\u8981\u7684\u4ef7\u683c\u3002",
    variantPriceEmptyHint: "\u8fd9\u4e2a\u53d8\u4f53\u8fd8\u6ca1\u6709\u72ec\u7acb\u4ef7\u683c\u3002\u53ea\u6709\u53d8\u4f53\u4ef7\u683c\u4e0d\u540c\u65f6\u624d\u9700\u8981\u6dfb\u52a0\u3002",
  },
};

function isPlaceholderProductImage(image: string) {
  return !image || image.includes("/products/phone-accessories.svg") || image.includes("/brand/luis-one-logo.jpg");
}

function productNeedsImage(product: AdminProductRecord) {
  return isPlaceholderProductImage(product.image) || product.variants.some((variant) => !variant.imageUrl);
}

function productHasStockStatus(product: AdminProductRecord, status: string) {
  return product.stockStatus === status || product.variants.some((variant) => variant.stockStatus === status);
}

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
    tiers: product.tiers,
    variants: product.variants.map((variant) => ({
      ...variant,
      tiers: variant.tiers,
    })),
  };
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

function escapeTemplateCsvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function buildBulkUploadTemplateCsv() {
  return [bulkUploadTemplateHeaders, bulkUploadTemplateSample]
    .map((row) => row.map(escapeTemplateCsvCell).join(","))
    .join("\r\n");
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
  const copy = language === "zh" ? productTextZh : text.en;
  const [products, setProducts] = useState(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<AdminProductRecord | null>(initialProducts[0] ?? null);
  const [editorMode, setEditorMode] = useState<EditorMode>("view");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [attentionFilter, setAttentionFilter] = useState<ProductAttentionFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [imageSize, setImageSize] = useState<"compact" | "normal" | "large">("compact");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(true);
  const [message, setMessage] = useState(initialError ?? "");
  const [editorOpen, setEditorOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const focusEditor = () => {
    window.setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const refreshProducts = async (preferredProductId?: string, options?: { revealSavedProduct?: boolean }) => {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const result = (await response.json().catch(() => ({ ok: false, message: "Product list refresh failed." }))) as ProductsListResponse;

    if (!response.ok || !result.ok || !result.products) {
      setMessage(result.message ?? "Product list refresh failed.");
      return false;
    }

    if (preferredProductId && options?.revealSavedProduct) {
      setSearch("");
      setCategoryFilter("all");
      setStockFilter("all");
      setActiveFilter("all");
      setAttentionFilter("all");
      setPage(1);
    }

    setProducts(result.products);
    setSelectedProduct((current) => {
      const preferred = preferredProductId ? result.products?.find((item) => item.id === preferredProductId) : null;

      if (preferred) {
        return preferred;
      }

      if (!current) {
        return null;
      }

      return result.products?.find((item) => item.id === current.id) ?? result.products?.[0] ?? null;
    });

    return true;
  };

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
  const inventoryWatchCounts = useMemo(() => ({
    all: products.length,
    unavailable: products.filter((product) => productHasStockStatus(product, "unavailable")).length,
    lowStock: products.filter((product) => productHasStockStatus(product, "low_stock")).length,
    missingImage: products.filter(productNeedsImage).length,
    hidden: products.filter((product) => !product.active).length,
  }), [products]);
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
      const attentionMatch =
        attentionFilter === "all" ||
        (attentionFilter === "unavailable" && productHasStockStatus(product, "unavailable")) ||
        (attentionFilter === "low_stock" && productHasStockStatus(product, "low_stock")) ||
        (attentionFilter === "missing_image" && productNeedsImage(product)) ||
        (attentionFilter === "hidden" && !product.active);

      return searchMatch && categoryMatch && stockMatch && activeMatch && attentionMatch;
    });
  }, [activeFilter, attentionFilter, categoryFilter, products, search, stockFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);
  const gridClassByImageSize = {
    compact: "grid gap-3 bg-zinc-50 p-4 sm:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6",
    normal: "grid gap-4 bg-zinc-50 p-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
    large: "grid gap-5 bg-zinc-50 p-4 sm:grid-cols-2 2xl:grid-cols-2 min-[1800px]:grid-cols-3",
  };
  const cardImagePadding = imageSize === "compact" ? "p-2" : imageSize === "large" ? "p-6" : "p-3";
  const watchCopy = inventoryWatchText[language];
  const inventoryWatchItems: Array<{ key: ProductAttentionFilter; label: string; count: number; tone: string }> = [
    { key: "all", label: watchCopy.all, count: inventoryWatchCounts.all, tone: "border-zinc-200 bg-white text-zinc-700" },
    { key: "unavailable", label: watchCopy.unavailable, count: inventoryWatchCounts.unavailable, tone: "border-zinc-200 bg-zinc-50 text-zinc-700" },
    { key: "low_stock", label: watchCopy.lowStock, count: inventoryWatchCounts.lowStock, tone: "border-amber-200 bg-amber-50 text-amber-800" },
    { key: "missing_image", label: watchCopy.missingImage, count: inventoryWatchCounts.missingImage, tone: "border-orange-200 bg-orange-50 text-orange-700" },
    { key: "hidden", label: watchCopy.hidden, count: inventoryWatchCounts.hidden, tone: "border-zinc-300 bg-zinc-100 text-zinc-700" },
  ];

  const startCreate = () => {
    setSelectedProduct(null);
    setEditorMode("create");
    setEditorOpen(true);
    focusEditor();
  };

  const startEdit = (product: AdminProductRecord) => {
    setSelectedProduct(product);
    setEditorMode("edit");
    setEditorOpen(true);
    focusEditor();
  };

  const startView = (product: AdminProductRecord) => {
    setSelectedProduct(product);
    setEditorMode("view");
    setEditorOpen(true);
    focusEditor();
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

    const refreshed = await refreshProducts();
    setMessage(refreshed ? copy.duplicateDone : "Product duplicated. Refresh the page if it is not visible yet.");
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

  const downloadBulkUploadTemplate = () => {
    const csv = buildBulkUploadTemplateCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wholesale-product-upload-template.csv";
    link.click();
    window.URL.revokeObjectURL(url);
    setMessage(copy.templateDownloaded);
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
            <button type="button" onClick={downloadBulkUploadTemplate} className="h-11 rounded-md border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-700 hover:border-orange-200 hover:text-orange-700">
              {copy.downloadTemplate}
            </button>
            <Link href="/admin/products/bulk-upload" className="grid h-11 place-items-center rounded-md border border-orange-200 bg-orange-50 px-4 text-sm font-black text-orange-700">
              {t("bulkUpload")}
            </Link>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-orange-100 bg-orange-50/60 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-700">{watchCopy.title}</p>
            {attentionFilter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setAttentionFilter("all");
                  setPage(1);
                }}
                className="text-xs font-black text-zinc-600 hover:text-orange-700"
              >
                Clear
              </button>
            ) : null}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {inventoryWatchItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setAttentionFilter(item.key);
                  setPage(1);
                }}
                className={`shrink-0 rounded-md border px-3 py-2 text-left text-xs font-black shadow-sm ${
                  attentionFilter === item.key ? "border-[#f65f18] bg-[#f65f18] text-white" : item.tone
                }`}
              >
                <span className="block">{item.label}</span>
                <span className="mt-0.5 block text-[11px] opacity-80">{item.count}</span>
              </button>
            ))}
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

      {editorOpen ? (
        <div ref={editorRef} className="scroll-mt-4">
          <ProductEditor
            key={`${editorMode}-${selectedProduct?.id ?? "new"}`}
            mode={editorMode}
            product={selectedProduct}
            categories={categories}
            mainCategories={mainCategories}
            onMessage={setMessage}
            onSaved={refreshProducts}
            onClose={() => setEditorOpen(false)}
          />
        </div>
      ) : (
        <div className="mb-4 rounded-md border border-orange-100 bg-orange-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-zinc-950">Product workspace is closed</p>
              <p className="mt-1 text-sm font-bold text-orange-700">Click Add Product or click any product card to edit it here.</p>
            </div>
            <button type="button" onClick={startCreate} className="h-10 rounded-md bg-[#f65f18] px-4 text-sm font-black text-white">
              {t("addProduct")}
            </button>
          </div>
        </div>
      )}

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
                    {productHasStockStatus(product, "unavailable") ? <span className="rounded-full bg-zinc-800 px-2 py-1 text-[10px] font-black text-white shadow-sm">{watchCopy.inquiryOnly}</span> : null}
                    {productNeedsImage(product) ? <span className="rounded-full bg-amber-500 px-2 py-1 text-[10px] font-black text-white shadow-sm">{watchCopy.noImage}</span> : null}
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
    </>
  );
}

function ProductEditor({
  mode,
  product,
  categories,
  mainCategories,
  onMessage,
  onSaved,
  onClose,
}: {
  mode: EditorMode;
  product: AdminProductRecord | null;
  categories: AdminCategoryOption[];
  mainCategories: AdminCategoryOption[];
  onMessage: (message: string) => void;
  onSaved: (preferredProductId?: string, options?: { revealSavedProduct?: boolean }) => Promise<boolean>;
  onClose: () => void;
}) {
  const { t, language } = useAdminI18n();
  const copy = language === "zh" ? productTextZh : text.en;
  const imageCopy = imageUploadText[language];
  const flowCopy = editorFlowText[language];
  const uploadStatusCopy = {
    optimizing: language === "zh" ? "图片优化中..." : "Optimizing image...",
    uploading: language === "zh" ? "图片上传中..." : "Uploading image...",
    uploadingVariant: (index: number) => (language === "zh" ? `正在上传变体 #${index + 1} 图片...` : `Uploading image for variant #${index + 1}...`),
    optimized: (from: string, to: string) =>
      language === "zh"
        ? `图片已从 ${from} 优化到 ${to}。点击 ${idleSaveActionLabel} 或 ${imageCopy.uploadImage}。`
        : `Image optimized from ${from} to ${to}. Click ${idleSaveActionLabel} or ${imageCopy.uploadImage}.`,
    selected: (fileName: string) =>
      language === "zh" ? `${fileName} 已选择。点击 ${idleSaveActionLabel} 或 ${imageCopy.uploadImage}。` : `${fileName} selected. Click ${idleSaveActionLabel} or ${imageCopy.uploadImage}.`,
    variantOptimized: (from: string, to: string) => (language === "zh" ? `变体图片已从 ${from} 优化到 ${to}。` : `Variant image optimized from ${from} to ${to}.`),
    variantUploaded: (index: number) =>
      language === "zh" ? `变体 #${index + 1} 图片已上传。请保存商品以保留这张图片。` : `Variant #${index + 1} image uploaded. Save the product to keep this image.`,
  };
  const [activeTab, setActiveTab] = useState<TranslationKey>("basicInfo");
  const [draft, setDraft] = useState<ProductDraft>(product ? productToDraft(product) : blankDraft(categories));
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageStatus, setImageStatus] = useState("");
  const [variantImageStatus, setVariantImageStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [successDialog, setSuccessDialog] = useState("");
  const subcategories = categories.filter((category) => category.parentId === draft.categoryId);
  const childCategories = categories.filter((category) => category.parentId === draft.subcategoryId);
  const disabled = mode === "view";
  const title = mode === "create" ? copy.createProduct : draft.name || t("productEditor");
  const basicReady = Boolean(draft.sku.trim() && draft.name.trim() && draft.categoryId && draft.moq > 0);
  const priceReady = draft.tiers.length > 0;
  const imageReady = Boolean(selectedImagePreview || draft.imageUrl);
  const variantsReady = draft.variants.length > 0;
  const readyToSave = basicReady && priceReady;
  const firstMissingRequiredTab: TranslationKey | null = !basicReady ? "basicInfo" : !priceReady ? "wholesalePricesTab" : null;
  const idleSaveActionLabel = mode === "create" ? flowCopy.saveUploadButton : flowCopy.saveChangesButton;
  const saveActionLabel = saving ? flowCopy.saving : idleSaveActionLabel;
  const editorSteps: ProductEditorStep[] = [
    {
      tab: "basicInfo",
      label: flowCopy.basicLabel,
      status: basicReady ? flowCopy.readyStep : flowCopy.requiredStep,
      ready: basicReady,
    },
    {
      tab: "wholesalePricesTab",
      label: flowCopy.priceLabel,
      status: priceReady ? `${draft.tiers.length} ${flowCopy.readyStep}` : flowCopy.requiredStep,
      ready: priceReady,
    },
    {
      tab: "imagesTab",
      label: flowCopy.imageLabel,
      status: imageReady ? flowCopy.readyStep : flowCopy.optionalStep,
      ready: imageReady,
      optional: true,
    },
    {
      tab: "variantsTab",
      label: flowCopy.variantsLabel,
      status: variantsReady ? `${draft.variants.length} ${flowCopy.readyStep}` : flowCopy.optionalStep,
      ready: variantsReady,
      optional: true,
    },
  ];

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

    setImageStatus(uploadStatusCopy.optimizing);

    try {
      const prepared = await prepareAdminUploadImage(file);
      setSelectedImage(prepared.file);
      setSelectedImagePreview(window.URL.createObjectURL(prepared.file));
      setImageStatus(
        prepared.compressed
          ? uploadStatusCopy.optimized(formatImageBytes(prepared.originalBytes), formatImageBytes(prepared.file.size))
          : uploadStatusCopy.selected(file.name),
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
    setImageStatus(uploadStatusCopy.uploading);

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
      setVariantImageStatus(imageCopy.imageInvalidType);
      return;
    }

    let uploadFile = file;

    try {
      const prepared = await prepareAdminUploadImage(file);
      uploadFile = prepared.file;
      if (prepared.compressed) {
        const status = uploadStatusCopy.variantOptimized(formatImageBytes(prepared.originalBytes), formatImageBytes(prepared.file.size));

        onMessage(status);
        setVariantImageStatus(status);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : imageCopy.imageTooLarge;

      onMessage(message);
      setVariantImageStatus(message);
      return;
    }

    const variant = draft.variants[variantIndex];
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("sku", variant.sku || draft.sku || draft.slug || "product-variant");

    setUploadingImage(true);
    setVariantImageStatus(uploadStatusCopy.uploadingVariant(variantIndex));

    try {
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
        const message = result.message ?? imageCopy.imageUploadFailed;

        onMessage(message);
        setVariantImageStatus(message);
        return;
      }

      updateVariant(variantIndex, { imageUrl: result.imageUrl });
      onMessage(imageCopy.imageUploadSuccess);
      setVariantImageStatus(uploadStatusCopy.variantUploaded(variantIndex));
    } finally {
      setUploadingImage(false);
    }
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
    const result = (await response.json().catch(() => ({ ok: false, message: "Save failed." }))) as {
      ok?: boolean;
      message?: string;
      productId?: string;
    };

    if (!response.ok || !result.ok) {
      onMessage(result.message ?? "Save failed.");
      return;
    }

    const successMessage = mode === "create" ? copy.productUploadSuccess : copy.productUpdateSuccess;
    const refreshed = await onSaved(result.productId ?? draft.id, { revealSavedProduct: mode === "create" });
    setSuccessDialog(refreshed ? successMessage : `${successMessage} Refresh the page if the product is not visible yet.`);
    onMessage(successMessage);
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
          <button type="button" onClick={onClose} className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700 hover:border-orange-200 hover:text-orange-700">
            {copy.closeEditor}
          </button>
          {mode !== "view" ? (
            <button type="button" onClick={() => void submit()} disabled={saving || uploadingImage} className="rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">
              {saveActionLabel}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-b border-zinc-100 pb-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-md border border-orange-100 bg-orange-50 p-4 sm:col-span-2 xl:col-span-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black text-zinc-950">{flowCopy.workflowTitle}</p>
              <p className="mt-1 text-xs font-bold text-orange-700">{flowCopy.workflowHint}</p>
              <p className={`mt-2 rounded-md border px-3 py-2 text-xs font-black ${readyToSave ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                {readyToSave ? flowCopy.saveReady : flowCopy.saveNeedsWork}
              </p>
            </div>
            <div className="w-full lg:max-w-[640px]">
              <div className="grid gap-2 sm:grid-cols-4">
                {editorSteps.map((step) => (
                  <WorkflowStep
                    key={step.tab}
                    label={step.label}
                    status={step.status}
                    ready={step.ready}
                    optional={step.optional}
                    active={activeTab === step.tab}
                    clickHint={flowCopy.clickToEdit}
                    onClick={() => setActiveTab(step.tab)}
                  />
                ))}
              </div>
              {firstMissingRequiredTab && mode !== "view" ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(firstMissingRequiredTab)}
                  className="mt-3 w-full rounded-md bg-zinc-950 px-4 py-2 text-xs font-black text-white hover:bg-zinc-800"
                >
                  {flowCopy.fixRequiredStep}
                </button>
              ) : null}
            </div>
          </div>
        </div>
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
            emptyHint={flowCopy.priceEmptyHint}
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
                {variantImageStatus ? (
                  <p className="mt-2 rounded-md border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-orange-700">
                    {variantImageStatus}
                  </p>
                ) : null}
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
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 md:col-span-2 xl:col-span-2">
                    <div className="flex gap-3">
                      <div
                        role="img"
                        aria-label={variant.name || "Variant image"}
                        className="h-20 w-20 shrink-0 rounded-md border border-orange-100 bg-white bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: `url("${variant.imageUrl || draft.imageUrl || "/products/phone-accessories.svg"}")` }}
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Input label={`${t("imageUrl")} (${t("variantsTab")})`} value={variant.imageUrl} onChange={(value) => updateVariant(variantIndex, { imageUrl: value })} disabled={disabled} />
                        {!variant.imageUrl ? (
                          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                            {imageCopy.variantImageFallback}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          <label className="inline-flex cursor-pointer rounded-md bg-orange-50 px-3 py-2 text-xs font-black text-orange-700 ring-1 ring-orange-100">
                            {uploadingImage ? "Uploading..." : imageCopy.uploadImage}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              disabled={disabled || uploadingImage}
                              onChange={(event) => void uploadVariantImage(variantIndex, event.target.files?.[0])}
                              className="sr-only"
                            />
                          </label>
                          <button
                            type="button"
                            disabled={disabled || !variant.imageUrl}
                            onClick={() => updateVariant(variantIndex, { imageUrl: "" })}
                            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-700 disabled:opacity-40"
                          >
                            {imageCopy.removeImage}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs font-bold text-zinc-500">Variant image URL overrides the main product image after customer selection.</p>
                <div className="mt-4">
                  <WholesalePriceEditor
                    disabled={disabled}
                    tiers={variant.tiers}
                    t={t}
                    maxQtyBlank={copy.maxQtyBlank}
                    addTierLabel={copy.addTier}
                    emptyHint={flowCopy.variantPriceEmptyHint}
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
                  {uploadingImage ? uploadStatusCopy.uploading : draft.imageUrl ? imageCopy.replaceImage : imageCopy.uploadImage}
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
              {!readyToSave ? flowCopy.saveNeedsWork : selectedImage ? copy.selectedImageSaveHint : flowCopy.saveReady}
            </p>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={saving || uploadingImage}
              className="h-11 rounded-md bg-[#f65f18] px-6 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60"
            >
              {saveActionLabel}
            </button>
          </div>
        </div>
      ) : null}
      {successDialog ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-zinc-950/45 px-4">
          <div className="w-full max-w-sm rounded-md border border-orange-100 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-orange-600 text-sm font-black text-white">OK</div>
            <h3 className="mt-4 text-lg font-black text-zinc-950">{successDialog}</h3>
            <p className="mt-2 text-sm font-bold text-zinc-500">{copy.productListUpdated}</p>
            <button
              type="button"
              onClick={() => {
                setSuccessDialog("");
                if (mode === "create") {
                  onClose();
                }
              }}
              className="mt-5 h-10 rounded-md bg-[#f65f18] px-5 text-sm font-black text-white"
            >
              {copy.closeToList}
            </button>
            {mode === "create" ? (
              <button
                type="button"
                onClick={() => {
                  setSuccessDialog("");
                  setDraft(blankDraft(categories));
                  setSelectedImage(null);
                  if (selectedImagePreview) {
                    window.URL.revokeObjectURL(selectedImagePreview);
                  }
                  setSelectedImagePreview("");
                  setImageStatus("");
                  setActiveTab("basicInfo");
                  onMessage(copy.addAnotherReady);
                }}
                className="mt-3 h-10 rounded-md border border-orange-200 bg-orange-50 px-5 text-sm font-black text-orange-700"
              >
                {copy.saveAndAddAnother}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function WorkflowStep({
  label,
  status,
  ready,
  optional,
  active,
  clickHint,
  onClick,
}: {
  label: string;
  status: string;
  ready: boolean;
  optional?: boolean;
  active: boolean;
  clickHint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border bg-white px-3 py-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
        active ? "border-[#f65f18] ring-2 ring-orange-100" : ready ? "border-emerald-200" : optional ? "border-zinc-200" : "border-orange-200"
      }`}
      title={clickHint}
    >
      <p className="truncate text-xs font-black text-zinc-900">{label}</p>
      <p className={`mt-1 truncate text-[11px] font-black ${ready ? "text-emerald-700" : optional ? "text-zinc-500" : "text-orange-700"}`}>
        {status}
      </p>
    </button>
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
  emptyHint,
  onUpdateTier,
  onDeleteTier,
  onAddTier,
}: {
  disabled: boolean;
  tiers: AdminProductTier[];
  t: (key: TranslationKey) => string;
  maxQtyBlank: string;
  addTierLabel: string;
  emptyHint: string;
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
          {emptyHint}
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
