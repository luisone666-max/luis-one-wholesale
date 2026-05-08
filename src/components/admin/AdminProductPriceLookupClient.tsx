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
    searchPlaceholder: "搜索 SKU、商品名、型号、适配车型或分类",
    allProducts: "全部商品",
    retailPrice: "零售价",
    wholesalePrice: "批发价",
    moq: "起订量",
    variants: "变体",
    noProducts: "没有找到匹配商品。",
    variantPrices: "变体价格",
  },
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

function compactSearchText(value: string) {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

const lookupAliases: Record<string, string[]> = {
  accessory: ["accessories"],
  accessories: ["accessory"],
  aerox: ["yamaha"],
  beat: ["honda"],
  box: ["topbox", "motobox"],
  brake: ["break", "lever"],
  bracket: ["mount", "holder"],
  click: ["honda"],
  full: ["helmet"],
  gille: ["helmet"],
  half: ["helmet"],
  helmet: ["helmets", "visor"],
  hnj: ["helmet"],
  ignition: ["keyset", "switch"],
  key: ["keyset", "ignition", "switch"],
  keyset: ["key", "ignition", "switch"],
  mio: ["yamaha"],
  mob: ["helmet"],
  modular: ["helmet"],
  moto: ["motorcycle"],
  motobox: ["topbox", "box"],
  motorcycle: ["moto"],
  nmax: ["yamaha"],
  shock: ["absorber", "suspension"],
  shocks: ["shock", "absorber", "suspension"],
  switch: ["ignition", "keyset"],
  topbox: ["top", "box", "bracket", "mount"],
  visor: ["helmet", "shield"],
  zebra: ["helmet"],
};

const lookupStopWords = new Set(["a", "an", "and", "for", "of", "the", "to", "with"]);

function expandLookupWords(words: string[]) {
  const expanded = new Set(words);

  for (const word of words) {
    const singular = word.endsWith("s") && word.length > 3 ? word.slice(0, -1) : "";

    if (singular) {
      expanded.add(singular);
    }

    for (const alias of lookupAliases[word] ?? []) {
      expanded.add(alias);
    }
  }

  return Array.from(expanded);
}

function lookupScore(product: AdminProductLookupRecord, rawQuery: string) {
  const originalWords = normalizeSearchText(rawQuery)
    .split(" ")
    .filter((word) => word.length > 1 && !lookupStopWords.has(word));

  if (!originalWords.length) {
    return 1;
  }

  const words = expandLookupWords(originalWords);
  const variantText = product.variants.map((variant) => `${variant.name} ${variant.sku} ${variant.model} ${variant.fits}`).join(" ");
  const fields = {
    sku: normalizeSearchText(product.sku),
    name: normalizeSearchText(product.name),
    category: normalizeSearchText(`${product.category} ${product.subcategory} ${product.childCategory}`),
    details: normalizeSearchText(`${product.brand} ${product.model} ${variantText}`),
  };
  const haystack = Object.values(fields).join(" ");
  const haystackWords = new Set(haystack.split(" ").filter(Boolean));
  const compactQuery = compactSearchText(rawQuery);
  const compactHaystack = compactSearchText(`${product.sku} ${product.name} ${product.category} ${product.subcategory} ${product.childCategory} ${product.brand} ${product.model} ${variantText}`);
  let score = 0;
  let originalMatches = 0;

  if (compactQuery && compactHaystack.includes(compactQuery)) {
    score += 90;
    originalMatches = originalWords.length;
  }

  for (const word of words) {
    const matched = haystackWords.has(word) || haystack.includes(word);

    if (matched) {
      score += fields.sku.includes(word) ? 18 : fields.name.includes(word) ? 14 : 8;

      if (originalWords.includes(word)) {
        originalMatches += 1;
      }
    }
  }

  if (originalWords.length > 1 && originalMatches < Math.ceil(originalWords.length / 2)) {
    return 0;
  }

  return originalMatches > 0 ? score + originalMatches * 12 : 0;
}

export function AdminProductPriceLookupClient({ products, initialError }: { products: AdminProductLookupRecord[]; initialError?: string }) {
  const { language } = useAdminI18n();
  const t = copy[language];
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const query = search.trim();

    if (!query) {
      return products;
    }

    return products
      .map((product) => ({ product, score: lookupScore(product, query) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
      .map((item) => item.product);
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
