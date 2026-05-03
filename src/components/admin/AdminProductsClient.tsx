"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import type { TranslationKey } from "@/lib/admin-i18n";
import type { AdminCategoryOption, AdminProductRecord, AdminProductTier } from "@/lib/admin-products-data";

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
  stockStatus: string;
  leadTime: string;
  imageUrl: string;
  description: string;
  active: boolean;
  supplierNotes: string;
  internalCostNotes: string;
  adminNotes: string;
  tiers: AdminProductTier[];
};

const pageSize = 10;
const stockStatuses = ["ready_stock", "for_order", "low_stock", "unavailable"];
const productTabs: TranslationKey[] = ["basicInfo", "categoryTab", "wholesalePricesTab", "imagesTab", "supplierNotesTab", "adminNotesTab"];

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
    bulkUploadDisabled: "CSV bulk upload is not built yet.",
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
    bulkUploadDisabled: "CSV 批量上传暂未开发。",
  },
};

const stockStatusKeyByValue: Record<string, TranslationKey> = {
  ready_stock: "readyStock",
  for_order: "forOrder",
  low_stock: "lowStock",
  unavailable: "unavailable",
};

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
    stockStatus: product.stockStatus,
    leadTime: product.leadTime,
    imageUrl: product.image,
    description: product.description,
    active: product.active,
    supplierNotes: product.supplierNotes,
    internalCostNotes: product.internalCostNotes,
    adminNotes: product.adminNotes,
    tiers: product.tiers.length ? product.tiers : defaultTiers(),
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
    stockStatus: "for_order",
    leadTime: "",
    imageUrl: "/products/phone-accessories.svg",
    description: "",
    active: true,
    supplierNotes: "",
    internalCostNotes: "",
    adminNotes: "",
    tiers: defaultTiers(),
  };
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
  const [message, setMessage] = useState(initialError ?? "");

  const mainCategories = categories.filter((category) => category.level === 1);
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
            className="h-11 rounded-md border border-zinc-200 px-4 text-sm outline-none focus:border-orange-500 xl:w-80"
          />
          <div className="flex flex-wrap gap-3">
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none">
              <option value="all">{copy.allCategories}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {"  ".repeat(category.level - 1)}{category.name}{category.active ? "" : " (hidden)"}
                </option>
              ))}
            </select>
            <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none">
              <option value="all">{copy.allStock}</option>
              {stockStatuses.map((status) => (
                <option key={status} value={status}>{labelForStock(t, status)}</option>
              ))}
            </select>
            <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)} className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none">
              <option value="all">{copy.allVisibility}</option>
              <option value="active">{t("activeToggle")}</option>
              <option value="hidden">{t("hidden")}</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={startCreate} className="h-11 rounded-md bg-[#f65f18] px-4 text-sm font-black text-white">
            {t("addProduct")}
          </button>
          <button type="button" onClick={() => setMessage(copy.bulkUploadDisabled)} className="h-11 rounded-md border border-orange-200 bg-orange-50 px-4 text-sm font-black text-orange-700">
            {t("bulkUpload")}
          </button>
          <button type="button" className="h-11 rounded-md border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-700">
            {t("bulkEdit")}
          </button>
          <button type="button" className="h-11 rounded-md border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-700">
            {t("exportCsv")}
          </button>
        </div>
      </div>

      <TableShell>
        <div className="flex flex-col gap-3 border-b border-zinc-100 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold text-zinc-600">
            {filteredProducts.length} {t("products")}
          </p>
          <label className="flex items-center gap-2 font-bold text-zinc-600">
            {t("pageSize")}
            <select className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none" defaultValue={pageSize}>
              <option>10</option>
            </select>
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1520px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t("productImage")}</th>
                <th className="px-4 py-3">{t("sku")}</th>
                <th className="px-4 py-3">{t("productName")}</th>
                <th className="px-4 py-3">{t("category")}</th>
                <th className="px-4 py-3">{t("subcategory")}</th>
                <th className="px-4 py-3">{t("childCategory")}</th>
                <th className="px-4 py-3">{t("moq")}</th>
                <th className="px-4 py-3">{t("priceRange")}</th>
                <th className="px-4 py-3">{t("stockStatus")}</th>
                <th className="px-4 py-3">{t("activeStatus")}</th>
                <th className="px-4 py-3">{t("supplierNotesIndicator")}</th>
                <th className="px-4 py-3">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visibleProducts.map((product) => (
                <tr key={product.id} className={product.active ? "bg-white" : "bg-zinc-50"}>
                  <td className="px-4 py-3">
                    <div className="h-14 w-14 rounded-md bg-orange-50 p-1">
                      <Image src={product.image} alt={product.name} width={56} height={56} className="h-full w-full object-contain" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-black text-zinc-950">{product.sku}</td>
                  <td className="px-4 py-3 font-bold text-zinc-800">{product.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{product.category}</td>
                  <td className="px-4 py-3 text-zinc-600">{product.subcategory}</td>
                  <td className="px-4 py-3 text-zinc-600">{product.childCategory}</td>
                  <td className="px-4 py-3 text-zinc-600">{product.moq}</td>
                  <td className="px-4 py-3 font-black text-orange-700">{product.priceRange}</td>
                  <td className="px-4 py-3"><StatusPill tone="orange">{labelForStock(t, product.stockStatus)}</StatusPill></td>
                  <td className="px-4 py-3"><StatusPill tone={product.active ? "green" : "neutral"}>{product.active ? t("activeToggle") : t("hidden")}</StatusPill></td>
                  <td className="px-4 py-3"><StatusPill tone={product.supplierNotes ? "orange" : "neutral"}>{product.supplierNotes ? t("supplierNotes") : "-"}</StatusPill></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => startView(product)} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">{t("view")}</button>
                      <button type="button" onClick={() => startEdit(product)} className="rounded-md border border-orange-200 px-3 py-2 text-xs font-black text-orange-700">{t("edit")}</button>
                      <button type="button" onClick={() => duplicateProduct(product)} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">{t("duplicate")}</button>
                      <button type="button" onClick={() => toggleVisibility(product)} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">{product.active ? t("hide") : t("unhide")}</button>
                      <button type="button" onClick={() => deleteProduct(product)} className="rounded-md border border-red-200 px-3 py-2 text-xs font-black text-red-700">{t("delete")}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibleProducts.length ? (
                <tr>
                  <td className="px-4 py-6 text-zinc-500" colSpan={12}>{copy.noProducts}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
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
  const [activeTab, setActiveTab] = useState<TranslationKey>("basicInfo");
  const [draft, setDraft] = useState<ProductDraft>(product ? productToDraft(product) : blankDraft(categories));
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

  const submit = async () => {
    const endpoint = mode === "create" ? "/api/admin/products" : `/api/admin/products/${draft.id}`;
    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    const result = (await response.json().catch(() => ({ ok: false, message: "Save failed." }))) as { ok?: boolean; message?: string };

    if (!response.ok || !result.ok) {
      onMessage(result.message ?? "Save failed.");
      return;
    }

    window.location.reload();
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
            <button type="button" onClick={submit} className="rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white">
              {mode === "create" ? copy.createProduct : copy.saveProduct}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto border-b border-zinc-100 pb-3">
        {productTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-md px-4 py-2 text-sm font-black ${activeTab === tab ? "bg-[#f65f18] text-white" : "bg-zinc-100 text-zinc-700"}`}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {activeTab === "basicInfo" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input label={t("sku")} value={draft.sku} onChange={(value) => updateDraft({ sku: value })} disabled={disabled} />
            <Input label={t("productName")} value={draft.name} onChange={(value) => updateDraft({ name: value })} disabled={disabled} />
            <Input label="Slug" value={draft.slug} onChange={(value) => updateDraft({ slug: value })} disabled={disabled} />
            <Input label={t("brand")} value={draft.brand} onChange={(value) => updateDraft({ brand: value })} disabled={disabled} />
            <Input label={t("model")} value={draft.model} onChange={(value) => updateDraft({ model: value })} disabled={disabled} />
            <Input label={t("moq")} type="number" value={String(draft.moq)} onChange={(value) => updateDraft({ moq: Number(value) || 1 })} disabled={disabled} />
            <label className="text-sm font-bold text-zinc-700">
              {t("stockStatus")}
              <select disabled={disabled} value={draft.stockStatus} onChange={(event) => updateDraft({ stockStatus: event.target.value })} className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
                {stockStatuses.map((status) => <option key={status} value={status}>{labelForStock(t, status)}</option>)}
              </select>
            </label>
            <Input label={t("leadTime")} value={draft.leadTime} onChange={(value) => updateDraft({ leadTime: value })} disabled={disabled} />
            <label className="flex items-center gap-3 text-sm font-bold text-zinc-700">
              <input type="checkbox" checked={draft.active} disabled={disabled} onChange={(event) => updateDraft({ active: event.target.checked })} className="h-4 w-4 accent-[#f65f18]" />
              {draft.active ? t("activeToggle") : t("hidden")}
            </label>
            <Textarea label={t("description")} value={draft.description} onChange={(value) => updateDraft({ description: value })} disabled={disabled} wide />
          </div>
        ) : null}

        {activeTab === "categoryTab" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <CategorySelect label={t("category")} value={draft.categoryId} categories={mainCategories} disabled={disabled} onChange={(value) => updateDraft({ categoryId: value, subcategoryId: "", childCategoryId: "" })} />
            <CategorySelect label={t("subcategory")} value={draft.subcategoryId} categories={subcategories} disabled={disabled} onChange={(value) => updateDraft({ subcategoryId: value, childCategoryId: "" })} optional />
            <CategorySelect label={t("childCategory")} value={draft.childCategoryId} categories={childCategories} disabled={disabled} onChange={(value) => updateDraft({ childCategoryId: value })} optional />
          </div>
        ) : null}

        {activeTab === "wholesalePricesTab" ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">min_qty</th>
                    <th className="px-4 py-3">max_qty</th>
                    <th className="px-4 py-3">unit_price</th>
                    <th className="px-4 py-3">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {draft.tiers.map((tier, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3"><SmallNumber value={tier.minQty} disabled={disabled} onChange={(value) => updateTier(index, { minQty: value })} /></td>
                      <td className="px-4 py-3"><SmallNumber value={tier.maxQty ?? ""} disabled={disabled} placeholder={copy.maxQtyBlank} onChange={(value) => updateTier(index, { maxQty: value || null })} /></td>
                      <td className="px-4 py-3"><SmallNumber value={tier.unitPrice} disabled={disabled} onChange={(value) => updateTier(index, { unitPrice: value })} /></td>
                      <td className="px-4 py-3">
                        <button type="button" disabled={disabled} onClick={() => updateDraft({ tiers: draft.tiers.filter((_, tierIndex) => tierIndex !== index) })} className="rounded-md border border-red-200 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-40">
                          {t("delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" disabled={disabled} onClick={() => updateDraft({ tiers: [...draft.tiers, { minQty: 1, maxQty: null, unitPrice: 1 }] })} className="mt-4 rounded-md border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700 disabled:opacity-40">
              {copy.addTier}
            </button>
          </div>
        ) : null}

        {activeTab === "imagesTab" ? (
          <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
            <div className="rounded-md bg-orange-50 p-4">
              <Image src={draft.imageUrl || "/products/phone-accessories.svg"} alt={draft.name || "Product"} width={160} height={160} className="aspect-square w-full object-contain" />
            </div>
            <Input label={t("imageUrl")} value={draft.imageUrl} onChange={(value) => updateDraft({ imageUrl: value })} disabled={disabled} />
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
