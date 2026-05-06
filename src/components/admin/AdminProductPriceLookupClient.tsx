"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AdminPageTitle, StatusPill } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import type { AdminProductLookupRecord, AdminProductTier } from "@/lib/admin-products-data";
import { formatPhp } from "@/lib/wholesale-pricing";

const stockTone: Record<string, "orange" | "green" | "neutral"> = {
  ready_stock: "green",
  for_order: "orange",
  low_stock: "orange",
  unavailable: "neutral",
};

const stockLabel: Record<string, string> = {
  ready_stock: "Ready Stock",
  for_order: "For Order",
  low_stock: "Low Stock",
  unavailable: "Unavailable",
};

const copy = {
  en: {
    caption: "Sales price lookup only. This page cannot create, edit, hide, delete, or upload products.",
    searchPlaceholder: "Search SKU, product name, model, fitment, or category",
    allProducts: "All Products",
    retailPrice: "Retail",
    wholesalePrice: "Wholesale",
    moq: "MOQ",
    variants: "Variants",
    noProducts: "No matching products.",
    variantPrices: "Variant prices",
  },
  zh: {
    caption: "销售查价专用。这个页面不能新增、编辑、隐藏、删除或上传商品。",
    searchPlaceholder: "搜索 SKU、产品名、型号、适用车型或分类",
    allProducts: "全部商品",
    retailPrice: "零售价",
    wholesalePrice: "批发价",
    moq: "MOQ",
    variants: "变体",
    noProducts: "没有找到匹配商品。",
    variantPrices: "变体价格",
  },
};

const priceLookupZh = {
  caption: "销售查价专用。这个页面不能新增、编辑、隐藏、删除或上传商品。",
  searchPlaceholder: "搜索 SKU、商品名、型号、适配车型或分类",
  allProducts: "全部商品",
  retailPrice: "零售价",
  wholesalePrice: "批发价",
  moq: "起订量",
  variants: "变体",
  noProducts: "没有找到匹配商品。",
  variantPrices: "变体价格",
};

const readablePriceLookupZh = {
  caption: "\u9500\u552e\u67e5\u4ef7\u4e13\u7528\u3002\u8fd9\u4e2a\u9875\u9762\u4e0d\u80fd\u65b0\u589e\u3001\u7f16\u8f91\u3001\u9690\u85cf\u3001\u5220\u9664\u6216\u4e0a\u4f20\u5546\u54c1\u3002",
  searchPlaceholder: "\u641c\u7d22 SKU\u3001\u5546\u54c1\u540d\u3001\u578b\u53f7\u3001\u9002\u914d\u8f66\u578b\u6216\u5206\u7c7b",
  allProducts: "\u5168\u90e8\u5546\u54c1",
  retailPrice: "\u96f6\u552e\u4ef7",
  wholesalePrice: "\u6279\u53d1\u4ef7",
  moq: "\u8d77\u8ba2\u91cf",
  variants: "\u53d8\u4f53",
  noProducts: "\u6ca1\u6709\u627e\u5230\u5339\u914d\u5546\u54c1\u3002",
  variantPrices: "\u53d8\u4f53\u4ef7\u683c",
};

function getTierRange(tiers: AdminProductTier[]) {
  if (!tiers.length) {
    return "-";
  }

  const prices = tiers.map((tier) => tier.unitPrice);
  return `${formatPhp(Math.min(...prices))} - ${formatPhp(Math.max(...prices))}`;
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/\bbreaks?\b/g, "brake")
    .replace(/\btop\s*box\b/g, "topbox")
    .replace(/\bkey\s*set\b/g, "keyset")
    .replace(/\bn\s*max\b/g, "nmax")
    .replace(/([a-z])([0-9])/g, "$1 $2")
    .replace(/([0-9])([a-z])/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function AdminProductPriceLookupClient({ products, initialError }: { products: AdminProductLookupRecord[]; initialError?: string }) {
  const { language } = useAdminI18n();
  const t = language === "zh" ? { ...priceLookupZh, ...readablePriceLookupZh } : copy.en;
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const query = normalizeSearchText(search);

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const variantText = product.variants.map((variant) => `${variant.name} ${variant.sku} ${variant.model} ${variant.fits}`).join(" ");
      const haystack = normalizeSearchText(`${product.sku} ${product.name} ${product.category} ${product.subcategory} ${product.childCategory} ${product.brand} ${product.model} ${variantText}`);
      return query.split(/\s+/).every((word) => haystack.includes(word));
    });
  }, [products, search]);

  return (
    <div className="space-y-5">
      <AdminPageTitle titleKey="products" caption={t.caption} />
      {initialError ? <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-800">{initialError}</div> : null}

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.searchPlaceholder}
          className="h-12 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-900 outline-none focus:border-orange-500"
        />
        <p className="mt-3 text-sm font-bold text-zinc-500">
          {filteredProducts.length} / {products.length} {t.allProducts}
        </p>
      </section>

      {filteredProducts.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <article key={product.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-orange-50">
                  <Image src={product.image} alt={product.name} fill sizes="96px" className="object-contain p-2" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-black text-zinc-700">{product.sku}</span>
                    <StatusPill tone={stockTone[product.stockStatus] ?? "neutral"}>{stockLabel[product.stockStatus] ?? product.stockStatus}</StatusPill>
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-base font-black text-zinc-950">{product.name}</h2>
                  <p className="mt-1 text-xs font-bold text-zinc-500">
                    {[product.category, product.subcategory, product.childCategory].filter(Boolean).join(" / ")}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-md bg-zinc-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">{t.retailPrice}</p>
                  <p className="mt-1 text-sm font-black text-zinc-950">{product.retailPrice ? formatPhp(product.retailPrice) : "-"}</p>
                </div>
                <div className="rounded-md bg-orange-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-orange-500">{t.wholesalePrice}</p>
                  <p className="mt-1 text-sm font-black text-orange-700">{product.priceRange}</p>
                </div>
                <div className="rounded-md bg-zinc-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">{t.moq}</p>
                  <p className="mt-1 text-sm font-black text-zinc-950">{product.moq}</p>
                </div>
              </div>

              {product.variants.length ? (
                <details className="mt-4 rounded-md border border-zinc-100 bg-zinc-50 p-3">
                  <summary className="cursor-pointer text-sm font-black text-zinc-800">
                    {t.variantPrices} ({product.variants.length})
                  </summary>
                  <div className="mt-3 space-y-2">
                    {product.variants.map((variant) => (
                      <div key={variant.id ?? variant.sku} className="rounded-md bg-white p-3 ring-1 ring-zinc-100">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-black text-zinc-950">{variant.name}</p>
                          <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-black text-zinc-600">{variant.sku || product.sku}</span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-zinc-500">
                          {variant.model || "-"} {variant.fits ? ` / ${variant.fits}` : ""}
                        </p>
                        <p className="mt-2 text-sm font-black text-orange-700">{getTierRange(variant.tiers)}</p>
                        <p className="mt-1 text-xs font-bold text-zinc-500">
                          {t.moq} {variant.moq} · {stockLabel[variant.stockStatus] ?? variant.stockStatus}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm font-bold text-zinc-500 shadow-sm">{t.noProducts}</section>
      )}
    </div>
  );
}
