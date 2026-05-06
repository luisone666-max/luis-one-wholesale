"use client";

import { useMemo, useState } from "react";
import { AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPosSalePrintTemplate } from "@/components/admin/AdminPosSalePrintTemplate";
import type { PosSaleRecord } from "@/lib/pos-data";
import { formatPhp } from "@/lib/wholesale-pricing";

type Customer = { id: string; name: string; phone: string; status: string };
type Product = { id: string; sku: string; name: string; retailPrice: number | null };
type PosSalesSummary = { todayTotal: number; monthTotal: number; waitingTotal: number; waitingCount: number; paidTotal: number; paidCount: number };

type DraftItem = {
  productId: string;
  sku: string;
  name: string;
  quantity: string;
  unitPrice: string;
  notes: string;
};

const copy = {
  en: {
    caption: "Offline in-store sales only. Create a sales slip here, then cashier confirms payment.",
    employeeNo: "Sales Employee No.",
    customer: "Customer",
    walkInCustomer: "Walk-in / Manual Customer",
    customerName: "Customer Name",
    customerPhone: "Customer Phone",
    paymentMethod: "Payment Method",
    discount: "Discount",
    priceNotes: "Price / discount notes",
    saleNotes: "Sale notes",
    addManualItem: "Add Manual Item",
    saveSale: "Save and Send to Cashier",
    product: "Product",
    qty: "Qty",
    unitPrice: "Unit Price",
    subtotal: "Subtotal",
    total: "Amount Due",
    remove: "Remove",
    saved: "Sale saved and sent to cashier.",
    discountTooHigh: "Discount cannot be greater than product total.",
    selectProduct: "Select product",
    onlineOrdersLink: "Website orders are handled in Online Orders.",
    flowTitle: "Offline POS flow",
    flowStep1: "1. Salesperson creates slip",
    flowStep2: "2. Cashier confirms payment",
    flowStep3: "3. Owner checks reports",
    myStats: "My Sales",
    allStats: "Store POS Sales",
    todaySales: "Today paid sales",
    monthSales: "This month paid sales",
    waitingCashier: "Waiting cashier",
    paidSales: "Paid sales",
    productSearch: "Search products by SKU or name",
    statNote: "Today and monthly sales count cashier-confirmed paid sales only. Waiting cashier slips are listed separately.",
    slips: "slips",
    recentSales: "Recent Sales Slips",
    refreshRecent: "Refresh Sales",
    saleNo: "Sale No",
    status: "Status",
    waitingStatus: "Waiting Cashier",
    paidStatus: "Paid",
    cancelledStatus: "Cancelled",
    date: "Date",
    printA6: "Print A6",
  },
  zh: {
    caption: "这里只做门店线下销售。销售员先开销售单，保存后交给收银员确认收款。",
    employeeNo: "销售员工号",
    customer: "客户",
    walkInCustomer: "散客 / 手动客户",
    customerName: "客户姓名",
    customerPhone: "客户电话",
    paymentMethod: "收款方式",
    discount: "折扣金额",
    priceNotes: "改价 / 折扣备注",
    saleNotes: "销售备注",
    addManualItem: "添加一行商品",
    saveSale: "保存并发送给收银",
    product: "商品",
    qty: "数量",
    unitPrice: "单价",
    subtotal: "小计",
    total: "应收金额",
    remove: "删除",
    saved: "销售单已保存，正在等待收银员确认收款。",
    discountTooHigh: "折扣不能大于商品小计。",
    selectProduct: "选择商品",
    onlineOrdersLink: "网站客户下单请去“线上订单”处理，这里只处理线下门店销售。",
    flowTitle: "线下 POS 流程",
    flowStep1: "1. 销售员开单",
    flowStep2: "2. 收银员确认收款",
    flowStep3: "3. 老板查看报表",
    myStats: "我的销售",
    allStats: "门店 POS 销售",
    todaySales: "今日已收款销售额",
    monthSales: "本月已收款销售额",
    waitingCashier: "待收银",
    paidSales: "已收款",
    productSearch: "搜索商品 SKU 或名称",
    statNote: "今日和本月销售额只统计收银员已确认收款的销售单，待收银金额单独显示。",
    slips: "张单",
    recentSales: "最近销售单",
    refreshRecent: "刷新销售单",
    saleNo: "销售单号",
    status: "状态",
    waitingStatus: "等待收银",
    paidStatus: "已收款",
    cancelledStatus: "已取消",
    date: "日期",
    printA6: "打印 A6",
  },
};

function inputClass() {
  return "h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-900 outline-none focus:border-orange-500";
}

function emptyItem(): DraftItem {
  return { productId: "", sku: "", name: "", quantity: "1", unitPrice: "0", notes: "" };
}

function shortDate(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

function productMatchesSearch(product: Product, search: string) {
  const words = normalizeSearchText(search).split(" ").filter(Boolean);

  if (!words.length) {
    return true;
  }

  const haystack = normalizeSearchText([product.sku, product.name].join(" "));
  const compactHaystack = haystack.replace(/\s+/g, "");
  const compactSearch = normalizeSearchText(search).replace(/\s+/g, "");

  return compactHaystack.includes(compactSearch) || words.every((word) => haystack.includes(word));
}

export function AdminSalesDeskClient({
  customers,
  products,
  defaultEmployeeNo,
  summary,
  summaryScope,
  recentSales,
  initialError,
}: {
  customers: Customer[];
  products: Product[];
  defaultEmployeeNo: string;
  summary: PosSalesSummary;
  summaryScope: "mine" | "all";
  recentSales: PosSaleRecord[];
  initialError?: string;
}) {
  const { language } = useAdminI18n();
  const t = language === "zh" ? copy.zh : copy.en;
  const [employeeNo, setEmployeeNo] = useState(defaultEmployeeNo);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [priceChangeNotes, setPriceChangeNotes] = useState("");
  const [saleNotes, setSaleNotes] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [sales, setSales] = useState(recentSales);
  const [printSale, setPrintSale] = useState<PosSaleRecord | null>(null);
  const [message, setMessage] = useState(initialError ?? "");
  const [loading, setLoading] = useState(false);

  const productTotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const quantity = Math.max(0, Number(item.quantity) || 0);
        const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
        return total + quantity * unitPrice;
      }, 0),
    [items],
  );
  const total = Math.max(0, productTotal - (Number(discountAmount) || 0));
  const filteredProducts = useMemo(() => {
    const needle = productSearch.trim().toLowerCase();

    if (!needle) {
      return products.slice(0, 80);
    }

    return products.filter((product) => productMatchesSearch(product, needle)).slice(0, 80);
  }, [productSearch, products]);

  function selectCustomer(id: string) {
    setCustomerId(id);
    const customer = customers.find((item) => item.id === id);

    if (customer) {
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
    }
  }

  function selectProduct(index: number, id: string) {
    const product = products.find((item) => item.id === id);
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              productId: id,
              sku: product?.sku ?? "",
              name: product?.name ?? "",
              unitPrice: String(product?.retailPrice ?? 0),
            }
          : item,
      ),
    );
  }

  function statusLabel(status: string) {
    if (status === "waiting_cashier") {
      return t.waitingStatus;
    }

    if (status === "paid") {
      return t.paidStatus;
    }

    if (status === "cancelled") {
      return t.cancelledStatus;
    }

    return status;
  }

  async function refreshRecent() {
    const url = summaryScope === "mine" ? "/api/admin/pos/sales?scope=mine" : "/api/admin/pos/sales";
    const response = await fetch(url);
    const result = (await response.json()) as { ok?: boolean; message?: string; sales?: PosSaleRecord[] };

    if (!response.ok || !result.ok) {
      setMessage(result.message ?? "Unable to refresh sales.");
      return;
    }

    setSales(result.sales ?? []);
  }

  function printPosSale(sale: PosSaleRecord) {
    setPrintSale(sale);
    window.setTimeout(() => window.print(), 50);
  }

  async function saveSale() {
    if ((Number(discountAmount) || 0) > productTotal) {
      setMessage(t.discountTooHigh);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/pos/sales", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          employeeNo,
          customerId,
          customerName,
          customerPhone,
          paymentMethod,
          discountAmount,
          priceChangeNotes,
          saleNotes,
          items,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; saleNo?: string };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "Sale save failed.");
        return;
      }

      setMessage(`${t.saved} ${result.saleNo ?? ""}`);
      setItems([emptyItem()]);
      setDiscountAmount("0");
      setPriceChangeNotes("");
      setSaleNotes("");
      await refreshRecent();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageTitle titleKey="salesDesk" caption={t.caption} />
      <section className="rounded-lg border border-orange-200 bg-orange-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">{t.flowTitle}</p>
            <p className="mt-2 text-sm font-bold text-orange-900">{t.onlineOrdersLink}</p>
          </div>
          <div className="grid gap-2 text-sm font-black text-orange-900 sm:grid-cols-3">
            <span className="rounded-md bg-white px-3 py-2 ring-1 ring-orange-100">{t.flowStep1}</span>
            <span className="rounded-md bg-white px-3 py-2 ring-1 ring-orange-100">{t.flowStep2}</span>
            <span className="rounded-md bg-white px-3 py-2 ring-1 ring-orange-100">{t.flowStep3}</span>
          </div>
        </div>
      </section>
      {message ? <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-800">{message}</div> : null}

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{summaryScope === "mine" ? t.myStats : t.allStats}</p>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">POS</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md bg-zinc-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">{t.todaySales}</p>
            <p className="mt-2 text-2xl font-black text-zinc-950">{formatPhp(summary.todayTotal)}</p>
          </div>
          <div className="rounded-md bg-orange-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-500">{t.monthSales}</p>
            <p className="mt-2 text-2xl font-black text-orange-700">{formatPhp(summary.monthTotal)}</p>
          </div>
          <div className="rounded-md bg-zinc-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">{t.waitingCashier}</p>
            <p className="mt-2 text-2xl font-black text-zinc-950">{formatPhp(summary.waitingTotal)}</p>
            <p className="mt-1 text-xs font-bold text-zinc-500">
              {summary.waitingCount} {t.slips}
            </p>
          </div>
          <div className="rounded-md bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-600">{t.paidSales}</p>
            <p className="mt-2 text-2xl font-black text-emerald-700">{formatPhp(summary.paidTotal)}</p>
            <p className="mt-1 text-xs font-bold text-emerald-700">
              {summary.paidCount} {t.slips}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs font-bold text-zinc-500">{t.statNote}</p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.employeeNo}</span>
            <input className={`${inputClass()} mt-2`} value={employeeNo} onChange={(event) => setEmployeeNo(event.target.value)} />
          </label>
          <label>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.customer}</span>
            <select className={`${inputClass()} mt-2`} value={customerId} onChange={(event) => selectCustomer(event.target.value)}>
              <option value="">{t.walkInCustomer}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.phone ? `- ${customer.phone}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.customerName}</span>
            <input className={`${inputClass()} mt-2`} value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
          </label>
          <label>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.customerPhone}</span>
            <input className={`${inputClass()} mt-2`} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
          </label>
          <label>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.paymentMethod}</span>
            <select className={`${inputClass()} mt-2`} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.discount}</span>
            <input className={`${inputClass()} mt-2`} type="number" min="0" step="0.01" value={discountAmount} onChange={(event) => setDiscountAmount(event.target.value)} />
          </label>
          <label>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.priceNotes}</span>
            <input className={`${inputClass()} mt-2`} value={priceChangeNotes} onChange={(event) => setPriceChangeNotes(event.target.value)} />
          </label>
          <label>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.saleNotes}</span>
            <input className={`${inputClass()} mt-2`} value={saleNotes} onChange={(event) => setSaleNotes(event.target.value)} />
          </label>
        </div>
      </section>

      <TableShell>
        <div className="border-b border-zinc-100 bg-white p-4">
          <input className={inputClass()} value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder={t.productSearch} />
        </div>
        <div className="overflow-x-auto pb-2">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t.product}</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">{t.qty}</th>
                <th className="px-4 py-3">{t.unitPrice}</th>
                <th className="px-4 py-3">{t.subtotal}</th>
                <th className="px-4 py-3">{t.remove}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3">
                    <select className={inputClass()} value={item.productId} onChange={(event) => selectProduct(index, event.target.value)}>
                      <option value="">{t.selectProduct}</option>
                      {filteredProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.sku} - {product.name}
                        </option>
                      ))}
                    </select>
                    <input className={`${inputClass()} mt-2`} value={item.name} onChange={(event) => setItems((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, name: event.target.value } : row)))} />
                  </td>
                  <td className="px-4 py-3">
                    <input className={inputClass()} value={item.sku} onChange={(event) => setItems((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, sku: event.target.value } : row)))} />
                  </td>
                  <td className="px-4 py-3">
                    <input className={inputClass()} type="number" min="1" value={item.quantity} onChange={(event) => setItems((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, quantity: event.target.value } : row)))} />
                  </td>
                  <td className="px-4 py-3">
                    <input className={inputClass()} type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => setItems((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, unitPrice: event.target.value } : row)))} />
                  </td>
                  <td className="px-4 py-3 font-black text-orange-700">{formatPhp((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}</td>
                  <td className="px-4 py-3">
                    <button type="button" className="rounded-md border border-red-200 px-3 py-2 text-xs font-black text-red-700" onClick={() => setItems((current) => current.filter((_, rowIndex) => rowIndex !== index))}>
                      {t.remove}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>

      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.total}</p>
          <p className="mt-1 text-3xl font-black text-[#f65f18]">{formatPhp(total)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setItems((current) => [...current, emptyItem()])} className="rounded-md border border-zinc-200 px-4 py-2.5 text-sm font-black text-zinc-700">
            {t.addManualItem}
          </button>
          <button type="button" disabled={loading} onClick={() => void saveSale()} className="rounded-md bg-[#f65f18] px-5 py-2.5 text-sm font-black text-white disabled:opacity-60">
            {t.saveSale}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 p-4">
          <div>
            <p className="text-lg font-black text-zinc-950">{t.recentSales}</p>
            <p className="mt-1 text-xs font-bold text-zinc-500">{summaryScope === "mine" ? t.myStats : t.allStats}</p>
          </div>
          <button type="button" disabled={loading} onClick={() => void refreshRecent()} className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-black text-zinc-700 disabled:opacity-60">
            {t.refreshRecent}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t.saleNo}</th>
                <th className="px-4 py-3">{t.customer}</th>
                <th className="px-4 py-3">{t.paymentMethod}</th>
                <th className="px-4 py-3">{t.total}</th>
                <th className="px-4 py-3">{t.status}</th>
                <th className="px-4 py-3">{t.date}</th>
                <th className="px-4 py-3">{t.printA6}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sales.length ? (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-4 py-3 font-black text-zinc-950">{sale.saleNo}</td>
                    <td className="px-4 py-3 text-zinc-600">{sale.customerName}</td>
                    <td className="px-4 py-3 text-zinc-600">{sale.paymentMethod}</td>
                    <td className="px-4 py-3 font-black text-orange-700">{formatPhp(sale.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={sale.status === "paid" ? "green" : "orange"}>{statusLabel(sale.status)}</StatusPill>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{shortDate(sale.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => printPosSale(sale)} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">
                        {t.printA6}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-sm font-bold text-zinc-500" colSpan={7}>
                    -
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <AdminPosSalePrintTemplate sale={printSale} />
    </div>
  );
}
