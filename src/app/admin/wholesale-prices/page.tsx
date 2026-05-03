"use client";

import { AdminShell, useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPageTitle, TableShell } from "@/components/admin/AdminUi";
import { adminProducts } from "@/lib/admin-mock-data";
import { products, formatMoney } from "@/lib/mock-data";

function WholesalePricesContent() {
  const { t } = useAdminI18n();

  return (
    <>
      <AdminPageTitle titleKey="wholesalePrices" />
      <div className="grid gap-4 xl:grid-cols-2">
        {products.map((product, index) => (
          <TableShell key={product.slug}>
            <div className="border-b border-zinc-100 bg-white px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">{adminProducts[index]?.sku}</p>
              <h2 className="mt-1 text-lg font-black text-zinc-950">{product.name}</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">{t("tier")}</th>
                  <th className="px-4 py-3">{t("priceRange")}</th>
                  <th className="px-4 py-3">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {product.tiers.map((tier) => (
                  <tr key={tier.label}>
                    <td className="px-4 py-3 font-black text-zinc-950">{tier.label}</td>
                    <td className="px-4 py-3 font-black text-orange-700">{formatMoney(tier.price)}</td>
                    <td className="px-4 py-3">
                      <button type="button" className="rounded-md border border-orange-200 px-3 py-2 text-xs font-black text-orange-700">
                        {t("edit")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        ))}
      </div>
    </>
  );
}

export default function AdminWholesalePricesPage() {
  return (
    <AdminShell>
      <WholesalePricesContent />
    </AdminShell>
  );
}
