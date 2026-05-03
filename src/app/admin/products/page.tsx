"use client";

import Image from "next/image";
import { AdminShell, useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPageTitle, Pager, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { adminProducts } from "@/lib/admin-mock-data";

function ProductsContent() {
  const { t } = useAdminI18n();

  return (
    <>
      <AdminPageTitle titleKey="productManagement" />
      <div className="mb-4 flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <input
          aria-label={t("searchProducts")}
          placeholder={t("searchProducts")}
          className="h-11 rounded-md border border-zinc-200 px-4 text-sm outline-none focus:border-orange-500 xl:w-80"
        />
        <div className="flex flex-wrap gap-3">
          <select className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none">
            <option>{t("filterCategory")}</option>
            <option>Motorcycle Parts</option>
            <option>Automotive Care</option>
            <option>Phone Accessories</option>
          </select>
          <select className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none">
            <option>{t("filterStock")}</option>
            <option>In stock</option>
            <option>Low stock</option>
            <option>Preorder</option>
          </select>
          <button type="button" className="h-11 rounded-md bg-[#f65f18] px-4 text-sm font-black text-white">
            {t("addProduct")}
          </button>
          <button type="button" className="h-11 rounded-md border border-orange-200 bg-orange-50 px-4 text-sm font-black text-orange-700">
            {t("bulkUpload")}
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
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t("image")}</th>
                <th className="px-4 py-3">{t("sku")}</th>
                <th className="px-4 py-3">{t("productName")}</th>
                <th className="px-4 py-3">{t("category")}</th>
                <th className="px-4 py-3">{t("moq")}</th>
                <th className="px-4 py-3">{t("priceRange")}</th>
                <th className="px-4 py-3">{t("stockStatus")}</th>
                <th className="px-4 py-3">{t("activeStatus")}</th>
                <th className="px-4 py-3">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {adminProducts.map((product) => (
                <tr key={product.sku}>
                  <td className="px-4 py-3">
                    <div className="h-14 w-14 rounded-md bg-orange-50 p-1">
                      <Image src={product.image} alt={product.name} width={56} height={56} className="h-full w-full object-contain" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-black text-zinc-950">{product.sku}</td>
                  <td className="px-4 py-3 font-bold text-zinc-800">{product.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{product.category}</td>
                  <td className="px-4 py-3 text-zinc-600">{product.moq}</td>
                  <td className="px-4 py-3 font-black text-orange-700">{product.priceRange}</td>
                  <td className="px-4 py-3"><StatusPill tone="orange">{product.stockStatus}</StatusPill></td>
                  <td className="px-4 py-3"><StatusPill tone={product.active ? "green" : "neutral"}>{product.active ? "Active" : "Inactive"}</StatusPill></td>
                  <td className="px-4 py-3">
                    <button type="button" className="rounded-md border border-orange-200 px-3 py-2 text-xs font-black text-orange-700">
                      {t("edit")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager />
      </TableShell>
    </>
  );
}

export default function AdminProductsPage() {
  return (
    <AdminShell>
      <ProductsContent />
    </AdminShell>
  );
}
