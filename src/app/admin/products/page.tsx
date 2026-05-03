"use client";

import Image from "next/image";
import { useState } from "react";
import { AdminShell, useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPageTitle, Pager, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { adminProducts, AdminProduct } from "@/lib/admin-mock-data";
import type { TranslationKey } from "@/lib/admin-i18n";

const productTabs: TranslationKey[] = [
  "basicInfo",
  "categoryTab",
  "wholesalePricesTab",
  "imagesTab",
  "supplierNotesTab",
  "adminNotesTab",
];

const csvColumns = [
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

function ProductsContent() {
  const { t } = useAdminI18n();
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct>(adminProducts[0]);
  const [activeTab, setActiveTab] = useState<TranslationKey>("basicInfo");

  const selectProduct = (product: AdminProduct, tab: TranslationKey = "basicInfo") => {
    setSelectedProduct(product);
    setActiveTab(tab);
  };

  return (
    <>
      <AdminPageTitle titleKey="productManagement" />
      <div className="mb-4 rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <input
            aria-label={t("searchProducts")}
            placeholder={t("searchProducts")}
            className="h-11 rounded-md border border-zinc-200 px-4 text-sm outline-none focus:border-orange-500 xl:w-80"
          />
          <div className="flex flex-wrap gap-3">
            <select className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none">
              <option>{t("filterCategory")}</option>
              <option>Motorcycle Parts</option>
              <option>Daily Essentials</option>
              <option>Electronics</option>
              <option>Food & Spices</option>
            </select>
            <select className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none">
              <option>{t("filterStock")}</option>
              <option>{t("readyStock")}</option>
              <option>{t("forOrder")}</option>
              <option>{t("lowStock")}</option>
              <option>{t("unavailable")}</option>
            </select>
            <select className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none">
              <option>{t("filterActive")}</option>
              <option>{t("activeToggle")}</option>
              <option>{t("hidden")}</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => selectProduct(adminProducts[0])} className="h-11 rounded-md bg-[#f65f18] px-4 text-sm font-black text-white">
            {t("addProduct")}
          </button>
          <button type="button" className="h-11 rounded-md border border-orange-200 bg-orange-50 px-4 text-sm font-black text-orange-700">
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
          <p className="font-bold text-zinc-600">{t("showingResults")}</p>
          <label className="flex items-center gap-2 font-bold text-zinc-600">
            {t("pageSize")}
            <select className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none">
              <option>20</option>
              <option>50</option>
              <option>100</option>
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
              {adminProducts.map((product) => (
                <tr key={product.sku} className={product.active ? "bg-white" : "bg-zinc-50"}>
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
                  <td className="px-4 py-3"><StatusPill tone="orange">{t(product.stockStatusKey)}</StatusPill></td>
                  <td className="px-4 py-3"><StatusPill tone={product.active ? "green" : "neutral"}>{product.active ? t("activeToggle") : t("hidden")}</StatusPill></td>
                  <td className="px-4 py-3"><StatusPill tone={product.supplierNotes ? "orange" : "neutral"}>{product.supplierNotes ? t("supplierNotes") : "-"}</StatusPill></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => selectProduct(product, "basicInfo")} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">{t("view")}</button>
                      <button type="button" onClick={() => selectProduct(product, "basicInfo")} className="rounded-md border border-orange-200 px-3 py-2 text-xs font-black text-orange-700">{t("edit")}</button>
                      <button type="button" className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">{t("duplicate")}</button>
                      <button type="button" className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">{product.active ? t("hide") : t("unhide")}</button>
                      <button type="button" className="rounded-md border border-red-200 px-3 py-2 text-xs font-black text-red-700">{t("delete")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager />
      </TableShell>

      <ProductEditor product={selectedProduct} activeTab={activeTab} setActiveTab={setActiveTab} />
      <BulkUploadMockup />
    </>
  );
}

function ProductEditor({
  product,
  activeTab,
  setActiveTab,
}: {
  product: AdminProduct;
  activeTab: TranslationKey;
  setActiveTab: (tab: TranslationKey) => void;
}) {
  const { t } = useAdminI18n();

  return (
    <section className="mt-5 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">{t("productEditor")}</p>
          <h2 className="mt-1 text-xl font-black text-zinc-950">{product.name}</h2>
          <p className="mt-1 text-sm font-bold text-zinc-500">{product.sku}</p>
        </div>
        <StatusPill tone="orange">{t("noAutomaticPricing")}</StatusPill>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto border-b border-zinc-100 pb-3">
        {productTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-md px-4 py-2 text-sm font-black ${
              activeTab === tab ? "bg-[#f65f18] text-white" : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {activeTab === "basicInfo" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label={t("sku")} value={product.sku} />
            <Field label={t("productName")} value={product.name} />
            <Field label={t("brand")} value={product.brand} />
            <Field label={t("model")} value={product.model} />
            <Field label={t("moq")} value={String(product.moq)} />
            <Field label={t("stockStatus")} value={t(product.stockStatusKey)} />
            <Field label={t("leadTime")} value={product.leadTime} />
            <Field label={t("activeHiddenStatus")} value={product.active ? t("activeToggle") : t("hidden")} />
            <label className="text-sm font-bold text-zinc-700 md:col-span-2 xl:col-span-4">
              {t("description")}
              <textarea defaultValue={product.description} className="mt-2 min-h-24 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700" />
            </label>
          </div>
        ) : null}

        {activeTab === "categoryTab" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t("category")} value={product.category} />
            <Field label={t("subcategory")} value={product.subcategory} />
            <Field label={t("childCategory")} value={product.childCategory} />
          </div>
        ) : null}

        {activeTab === "wholesalePricesTab" ? (
          <div className="grid gap-4 md:grid-cols-4">
            <Field label={t("price1")} value={product.tiers.price1} />
            <Field label={t("price6")} value={product.tiers.price6} />
            <Field label={t("price12")} value={product.tiers.price12} />
            <Field label={t("price50")} value={product.tiers.price50} />
          </div>
        ) : null}

        {activeTab === "imagesTab" ? (
          <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
            <div className="rounded-md bg-orange-50 p-4">
              <Image src={product.image} alt={product.name} width={160} height={160} className="aspect-square w-full object-contain" />
            </div>
            <Field label={t("imageUrl")} value={product.image} />
          </div>
        ) : null}

        {activeTab === "supplierNotesTab" ? (
          <div>
            <p className="mb-4 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
              {t("supplierNotesAdminOnly")}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <NoteField label={t("supplierNotes")} value={product.supplierNotes} />
              <NoteField label={t("internalCostNotes")} value={product.internalCostNotes} />
            </div>
          </div>
        ) : null}

        {activeTab === "adminNotesTab" ? <NoteField label={t("adminNotes")} value={product.adminNotes} /> : null}
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="text-sm font-bold text-zinc-700">
      {label}
      <input defaultValue={value} className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700" />
    </label>
  );
}

function NoteField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-sm font-bold text-zinc-700">
      {label}
      <textarea defaultValue={value} className="mt-2 min-h-28 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700" />
    </label>
  );
}

function BulkUploadMockup() {
  const { t } = useAdminI18n();

  return (
    <section className="mt-5 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">{t("bulkUploadTitle")}</p>
          <h2 className="mt-1 text-xl font-black text-zinc-950">{t("bulkUpload")}</h2>
        </div>
        <button type="button" className="h-10 rounded-md border border-orange-200 bg-orange-50 px-4 text-sm font-black text-orange-700">
          {t("downloadCsvTemplate")}
        </button>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-md border-2 border-dashed border-orange-200 bg-orange-50 p-6 text-center">
          <p className="text-sm font-black text-orange-700">{t("uploadCsvArea")}</p>
          <p className="mt-2 text-xs font-bold text-orange-600">{t("previewImport")}</p>
          <button type="button" className="mt-5 h-10 rounded-md bg-[#f65f18] px-4 text-sm font-black text-white">
            {t("previewImport")}
          </button>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-black text-zinc-950">{t("validationResult")}</p>
          <p className="mt-2 text-sm text-zinc-600">{t("csvColumns")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {csvColumns.map((column) => (
              <span key={column} className="rounded bg-white px-2 py-1 text-xs font-bold text-zinc-600 ring-1 ring-zinc-200">
                {column}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AdminProductsPage() {
  return (
    <AdminShell>
      <ProductsContent />
    </AdminShell>
  );
}
