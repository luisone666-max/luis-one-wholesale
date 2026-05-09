"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPosSalePrintTemplate } from "@/components/admin/AdminPosSalePrintTemplate";
import type { PosProductCatalogRecord, PosSaleRecord } from "@/lib/pos-data";
import { formatPhp } from "@/lib/wholesale-pricing";

type Customer = { id: string; name: string; phone: string; status: string };
type Product = PosProductCatalogRecord;
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
    productSearch: "Search SKU, product name, model, category, or variant",
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
    stepCustomer: "1. Customer and payment",
    stepItems: "2. Products and price",
    stepSubmit: "3. Send to cashier",
    memberCustomer: "Member customer selected. Points are awarded after cashier confirms payment.",
    walkInNoPoints: "Walk-in customer. No member points will be awarded unless you select a customer account.",
    amountPreview: "Cashier will collect",
    cashPaymentHint: "Cash goes into the cash drawer after cashier confirmation.",
    transferPaymentHint: "GCash / bank transfer is recorded separately from physical cash.",
    customerNamePlaceholder: "Walk-in customer name",
    memberBadge: "Member",
    walkInBadge: "Walk-in",
    employeeLocked: "Your employee number is locked for audit records.",
    quickAddProducts: "Quick Add Products",
    tapProductToAdd: "Click a product below to add it to the sales slip. Click again to increase quantity.",
    noProductResults: "No matching products. You can still add a manual item.",
    orderBreakdown: "Order Breakdown",
    productTotal: "Product Total",
    cashierReceives: "Cashier Receives",
    details: "Details",
    hideDetails: "Hide Details",
    itemDetails: "Item Details",
    auditTrail: "Audit Trail",
    noAudit: "No audit records yet.",
    by: "By",
    reason: "Reason",
    statusChange: "Status Change",
    cashier: "Cashier",
    salesSlipStatus: "Sales Slip Status",
    activeSale: "Current slip",
    itemCount: "Items",
    totalQty: "Total Qty",
    customerType: "Customer Type",
    payment: "Payment",
    readyForCashier: "Ready for cashier confirmation",
    needProductsFirst: "Add at least one product or manual item.",
    sendToCashierNow: "Send to Cashier",
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
    productSearch: "搜索 SKU、商品名、型号、分类或变体",
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
    stepCustomer: "1. 客户与收款方式",
    stepItems: "2. 商品与价格",
    stepSubmit: "3. 发送给收银",
    memberCustomer: "已选择会员客户。收银确认后会自动计算积分。",
    walkInNoPoints: "散客单。除非选择客户账号，否则不会累计会员积分。",
    amountPreview: "收银员应收",
    cashPaymentHint: "现金单会在收银确认后进入钱箱现金统计。",
    transferPaymentHint: "GCash / 银行转账会单独统计，不进入实体钱箱现金。",
    customerNamePlaceholder: "散客姓名",
    memberBadge: "会员",
    walkInBadge: "散客",
    employeeLocked: "工号已锁定，用于销售归属和审计记录。",
    details: "详情",
    hideDetails: "收起详情",
    itemDetails: "商品明细",
    auditTrail: "操作记录",
    noAudit: "暂无操作记录。",
    by: "操作人",
    reason: "原因",
    statusChange: "状态变化",
    cashier: "收银员",
  },
};

const zhCopy = {
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
  onlineOrdersLink: "网站客户订单请去“线上订单”处理，这里只处理线下门店销售。",
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
  productSearch: "搜索 SKU、商品名、型号、分类或变体",
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
  stepCustomer: "1. 客户与收款方式",
  stepItems: "2. 商品与价格",
  stepSubmit: "3. 发送给收银",
  memberCustomer: "已选择会员客户。收银确认后会自动计算积分。",
  walkInNoPoints: "散客单。除非选择客户账号，否则不会累计会员积分。",
  amountPreview: "收银员应收",
  cashPaymentHint: "现金单会在收银确认后进入钱箱现金统计。",
  transferPaymentHint: "GCash / 银行转账会单独统计，不进入实体钱箱现金。",
  customerNamePlaceholder: "散客姓名",
  memberBadge: "会员",
  walkInBadge: "散客",
  employeeLocked: "工号已锁定，用于销售归属和审计记录。",
  quickAddProducts: "快速加商品",
  tapProductToAdd: "点击下面商品加入销售单，重复点同款会自动增加数量。",
  noProductResults: "没有找到商品，也可以手动添加一行。",
  orderBreakdown: "订单拆分",
  productTotal: "商品小计",
  cashierReceives: "收银员应收",
  details: "详情",
  hideDetails: "收起详情",
  itemDetails: "商品明细",
  auditTrail: "操作记录",
  noAudit: "暂无操作记录。",
  by: "操作人",
  reason: "原因",
  statusChange: "状态变化",
  cashier: "收银员",
  salesSlipStatus: "\u9500\u552e\u5355\u72b6\u6001",
  activeSale: "\u5f53\u524d\u9500\u552e\u5355",
  itemCount: "\u5546\u54c1\u884c",
  totalQty: "\u603b\u6570\u91cf",
  customerType: "\u5ba2\u6237\u7c7b\u578b",
  payment: "\u6536\u6b3e\u65b9\u5f0f",
  readyForCashier: "\u53ef\u4ee5\u53d1\u7ed9\u6536\u94f6\u786e\u8ba4",
  needProductsFirst: "\u5148\u6dfb\u52a0\u81f3\u5c11\u4e00\u4e2a\u5546\u54c1\u6216\u624b\u52a8\u9879\u76ee\u3002",
  sendToCashierNow: "\u53d1\u7ed9\u6536\u94f6",
} satisfies typeof copy.en;

const salesDeskFlowText = {
  en: {
    quickAddProducts: "Quick Add Products",
    tapProductToAdd: "Click a product below to add it to the sales slip. Click again to increase quantity.",
    noProductResults: "No matching products. You can still add a manual item.",
    orderBreakdown: "Order Breakdown",
    productTotal: "Product Total",
    cashierReceives: "Cashier Receives",
  },
  zh: {
    quickAddProducts: "\u5feb\u901f\u52a0\u5546\u54c1",
    tapProductToAdd: "\u70b9\u51fb\u4e0b\u9762\u5546\u54c1\u52a0\u5165\u9500\u552e\u5355\uff0c\u91cd\u590d\u70b9\u540c\u6b3e\u4f1a\u81ea\u52a8\u589e\u52a0\u6570\u91cf\u3002",
    noProductResults: "\u6ca1\u6709\u627e\u5230\u5546\u54c1\uff0c\u4e5f\u53ef\u4ee5\u624b\u52a8\u6dfb\u52a0\u4e00\u884c\u3002",
    orderBreakdown: "\u8ba2\u5355\u62c6\u5206",
    productTotal: "\u5546\u54c1\u5c0f\u8ba1",
    cashierReceives: "\u6536\u94f6\u5458\u5e94\u6536",
  },
};

const saleActionsText = {
  en: {
    editSale: "Edit",
    cancelSale: "Cancel",
    voidPaidSale: "Void Paid",
    stopEditing: "Stop Editing",
    editingSale: "Editing sale",
    updateSale: "Save Changes and Send to Cashier",
    editReason: "Corrected before cashier confirmation.",
    cancelReasonPrompt: "Reason for cancelling this sales slip?",
    voidReasonPrompt: "Owner/Admin reason for voiding this paid sale?",
    cancelDone: "Sales slip cancelled.",
    voidDone: "Paid sale voided. Payment total was reversed.",
    action: "Action",
  },
  zh: {
    editSale: "修改",
    cancelSale: "取消",
    voidPaidSale: "作废已收款",
    stopEditing: "停止修改",
    editingSale: "正在修改销售单",
    updateSale: "保存修改并发送给收银",
    editReason: "收银确认前修改销售单。",
    cancelReasonPrompt: "请输入取消这张销售单的原因：",
    voidReasonPrompt: "老板/Admin 作废已收款销售单的原因：",
    cancelDone: "销售单已取消。",
    voidDone: "已收款销售单已作废，收款金额已反向冲销。",
    action: "操作",
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

  const haystack = normalizeSearchText(
    [
      product.sku,
      product.name,
      product.slug,
      product.category,
      product.subcategory,
      product.childCategory,
      product.brand,
      product.model,
      product.stockStatus,
      product.leadTime,
      product.description,
      product.variantSearchText,
    ].join(" "),
  );
  const compactHaystack = haystack.replace(/\s+/g, "");
  const compactSearch = normalizeSearchText(search).replace(/\s+/g, "");

  return compactHaystack.includes(compactSearch) || words.every((word) => haystack.includes(word));
}

function productMetaText(product: Product) {
  return [product.category, product.subcategory, product.childCategory, product.brand, product.model].filter(Boolean).slice(0, 3).join(" / ");
}

function paymentMethodLabel(method: string, language: "en" | "zh") {
  const labels: Record<"en" | "zh", Record<string, string>> = {
    en: {
      cash: "Cash",
      gcash: "GCash",
      bank_transfer: "Bank Transfer",
      other: "Other",
    },
    zh: {
      cash: "\u73b0\u91d1",
      gcash: "GCash",
      bank_transfer: "\u94f6\u884c\u8f6c\u8d26",
      other: "\u5176\u4ed6",
    },
  };

  return labels[language][method] ?? method;
}

function isToday(value: string) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function isThisMonth(value: string) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function subtractSaleFromSummary(summary: PosSalesSummary, sale: PosSaleRecord) {
  const next = { ...summary };

  if (sale.status === "waiting_cashier") {
    next.waitingCount = Math.max(0, next.waitingCount - 1);
    next.waitingTotal = Math.max(0, next.waitingTotal - sale.totalAmount);
  }

  if (sale.status === "paid") {
    next.paidCount = Math.max(0, next.paidCount - 1);
    next.paidTotal = Math.max(0, next.paidTotal - sale.totalAmount);

    if (isThisMonth(sale.createdAt)) {
      next.monthTotal = Math.max(0, next.monthTotal - sale.totalAmount);
    }

    if (isToday(sale.createdAt)) {
      next.todayTotal = Math.max(0, next.todayTotal - sale.totalAmount);
    }
  }

  return next;
}

export function AdminSalesDeskClient({
  customers,
  products,
  defaultEmployeeNo,
  canChangeEmployeeNo,
  summary,
  summaryScope,
  recentSales,
  initialError,
}: {
  customers: Customer[];
  products: Product[];
  defaultEmployeeNo: string;
  canChangeEmployeeNo: boolean;
  summary: PosSalesSummary;
  summaryScope: "mine" | "all";
  recentSales: PosSaleRecord[];
  initialError?: string;
}) {
  const { language } = useAdminI18n();
  const t = language === "zh" ? zhCopy : copy.en;
  const ui = salesDeskFlowText[language];
  const actionText = saleActionsText[language];
  const [summaryState, setSummaryState] = useState(summary);
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
  const [editingSaleId, setEditingSaleId] = useState("");
  const [editingSaleNo, setEditingSaleNo] = useState("");
  const [expandedSaleId, setExpandedSaleId] = useState("");
  const [message, setMessage] = useState(initialError ?? "");
  const [loading, setLoading] = useState(false);
  const selectedCustomer = useMemo(() => customers.find((item) => item.id === customerId), [customerId, customers]);

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
  const meaningfulItems = useMemo(() => items.filter((item) => item.productId || item.sku.trim() || item.name.trim()), [items]);
  const itemLineCount = meaningfulItems.length;
  const totalQuantity = meaningfulItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
  const canSubmitSale = itemLineCount > 0 && total >= 0 && !loading;
  const filteredProducts = useMemo(() => {
    const needle = productSearch.trim().toLowerCase();

    if (!needle) {
      return products.slice(0, 80);
    }

    return products.filter((product) => productMatchesSearch(product, needle)).slice(0, 80);
  }, [productSearch, products]);

  useEffect(() => {
    let active = true;

    const refreshQuietly = async () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      const url = summaryScope === "mine" ? "/api/admin/pos/sales?scope=mine" : "/api/admin/pos/sales";
      const response = await fetch(url);
      const result = (await response.json().catch(() => null)) as { ok?: boolean; sales?: PosSaleRecord[] } | null;

      if (active && response.ok && result?.ok) {
        setSales(result.sales ?? []);
      }
    };

    const timer = window.setInterval(() => {
      void refreshQuietly();
    }, 20000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [summaryScope]);

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

  function addProductToSlip(product: Product) {
    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.productId === product.id);
      const productPrice = String(product.retailPrice ?? 0);

      if (existingIndex >= 0) {
        return current.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: String((Number(item.quantity) || 0) + 1),
              }
            : item,
        );
      }

      const nextItem: DraftItem = {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: "1",
        unitPrice: productPrice,
        notes: "",
      };
      const emptyIndex = current.findIndex((item) => !item.productId && !item.sku && !item.name);

      if (emptyIndex >= 0) {
        return current.map((item, index) => (index === emptyIndex ? nextItem : item));
      }

      return [...current, nextItem];
    });
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

    if (status === "returned_to_sales") {
      return language === "zh" ? "退回销售修改" : "Returned to Sales";
    }

    if (status === "voided") {
      return language === "zh" ? "已作废" : "Voided";
    }

    return status;
  }

  function auditActionLabel(action: string) {
    const labels: Record<string, string> = {
      created: language === "zh" ? "创建销售单" : "Created",
      updated: language === "zh" ? "修改销售单" : "Updated",
      returned_to_sales: language === "zh" ? "退回销售修改" : "Returned to Sales",
      cancelled: language === "zh" ? "取消销售单" : "Cancelled",
      payment_confirmed: language === "zh" ? "收银确认收款" : "Payment Confirmed",
      voided_paid_sale: language === "zh" ? "作废已收款" : "Voided Paid Sale",
    };

    return labels[action] ?? action.replace(/_/g, " ");
  }

  function resetForm() {
    setItems([emptyItem()]);
    setCustomerId("");
    setCustomerName("");
    setCustomerPhone("");
    setDiscountAmount("0");
    setPriceChangeNotes("");
    setSaleNotes("");
    setEditingSaleId("");
    setEditingSaleNo("");

    if (!canChangeEmployeeNo) {
      setEmployeeNo(defaultEmployeeNo);
    }
  }

  function loadSaleForEdit(sale: PosSaleRecord) {
    setEditingSaleId(sale.id);
    setEditingSaleNo(sale.saleNo);
    setEmployeeNo(sale.salespersonEmployeeNo || defaultEmployeeNo);
    setCustomerId(sale.customerId);
    setCustomerName(sale.customerName);
    setCustomerPhone(sale.customerPhone);
    setPaymentMethod(sale.paymentMethod || "cash");
    setDiscountAmount(String(sale.discountAmount ?? 0));
    setPriceChangeNotes(sale.priceChangeNotes);
    setSaleNotes(sale.saleNotes);
    setItems(
      sale.items.length
        ? sale.items.map((item) => ({
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            notes: item.notes,
          }))
        : [emptyItem()],
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  async function runSaleAction(sale: PosSaleRecord, action: "cancel" | "void_paid", promptText: string, successText: string) {
    const reason = window.prompt(promptText);

    if (!reason?.trim()) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/pos/sales/${sale.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "Sale action failed.");
        return;
      }

      setSummaryState((current) => subtractSaleFromSummary(current, sale));
      setMessage(successText);
      await refreshRecent();
    } finally {
      setLoading(false);
    }
  }

  async function saveSale() {
    if ((Number(discountAmount) || 0) > productTotal) {
      setMessage(t.discountTooHigh);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const wasEditingSale = editingSaleId ? sales.find((sale) => sale.id === editingSaleId) : undefined;
      const response = await fetch(editingSaleId ? `/api/admin/pos/sales/${editingSaleId}` : "/api/admin/pos/sales", {
        method: editingSaleId ? "PATCH" : "POST",
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
          reason: actionText.editReason,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; saleNo?: string };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "Sale save failed.");
        return;
      }

      setSummaryState((current) => {
        const base = wasEditingSale ? subtractSaleFromSummary(current, wasEditingSale) : { ...current };
        return {
          ...base,
          waitingCount: base.waitingCount + 1,
          waitingTotal: base.waitingTotal + total,
        };
      });
      setMessage(`${editingSaleId ? actionText.updateSale : t.saved} ${result.saleNo ?? ""}`);
      resetForm();
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
      {editingSaleId ? (
        <section className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {actionText.editingSale}: {editingSaleNo}
          </span>
          <button type="button" onClick={resetForm} className="rounded-md border border-amber-300 bg-white px-4 py-2 text-xs font-black text-amber-800">
            {actionText.stopEditing}
          </button>
        </section>
      ) : null}

      <section className="sticky top-2 z-20 rounded-lg border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur print:hidden">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-md bg-zinc-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">{t.salesSlipStatus}</p>
              <p className="mt-1 text-sm font-black text-zinc-950">{itemLineCount ? t.readyForCashier : t.needProductsFirst}</p>
            </div>
            <div className="rounded-md bg-zinc-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">{t.customerType}</p>
              <p className="mt-1 text-sm font-black text-zinc-950">{selectedCustomer ? t.memberBadge : t.walkInBadge}</p>
            </div>
            <div className="rounded-md bg-zinc-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">{t.itemCount}</p>
              <p className="mt-1 text-sm font-black text-zinc-950">
                {itemLineCount} / {t.totalQty} {totalQuantity}
              </p>
            </div>
            <div className="rounded-md bg-zinc-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">{t.payment}</p>
              <p className="mt-1 text-sm font-black text-zinc-950">{paymentMethodLabel(paymentMethod, language)}</p>
            </div>
            <div className="rounded-md bg-orange-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-orange-500">{ui.cashierReceives}</p>
              <p className="mt-1 text-lg font-black text-orange-700">{formatPhp(total)}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={!canSubmitSale}
            onClick={() => void saveSale()}
            className="h-12 rounded-md bg-[#f65f18] px-5 text-sm font-black text-white shadow-sm disabled:opacity-50"
          >
            {editingSaleId ? actionText.updateSale : t.sendToCashierNow}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{summaryScope === "mine" ? t.myStats : t.allStats}</p>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">POS</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md bg-zinc-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">{t.todaySales}</p>
            <p className="mt-2 text-2xl font-black text-zinc-950">{formatPhp(summaryState.todayTotal)}</p>
          </div>
          <div className="rounded-md bg-orange-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-500">{t.monthSales}</p>
            <p className="mt-2 text-2xl font-black text-orange-700">{formatPhp(summaryState.monthTotal)}</p>
          </div>
          <div className="rounded-md bg-zinc-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">{t.waitingCashier}</p>
            <p className="mt-2 text-2xl font-black text-zinc-950">{formatPhp(summaryState.waitingTotal)}</p>
            <p className="mt-1 text-xs font-bold text-zinc-500">
              {summaryState.waitingCount} {t.slips}
            </p>
          </div>
          <div className="rounded-md bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-600">{t.paidSales}</p>
            <p className="mt-2 text-2xl font-black text-emerald-700">{formatPhp(summaryState.paidTotal)}</p>
            <p className="mt-1 text-xs font-bold text-emerald-700">
              {summaryState.paidCount} {t.slips}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs font-bold text-zinc-500">{t.statNote}</p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-lg font-black text-zinc-950">{t.stepCustomer}</p>
            <p className="mt-1 text-xs font-bold text-zinc-500">{selectedCustomer ? t.memberCustomer : t.walkInNoPoints}</p>
          </div>
          <StatusPill tone={selectedCustomer ? "green" : "neutral"}>{selectedCustomer ? t.memberBadge : t.walkInBadge}</StatusPill>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.employeeNo}</span>
            <input
              className={`${inputClass()} mt-2 ${canChangeEmployeeNo ? "" : "bg-zinc-100 text-zinc-500"}`}
              value={employeeNo}
              readOnly={!canChangeEmployeeNo}
              onChange={(event) => setEmployeeNo(event.target.value)}
            />
            {!canChangeEmployeeNo ? <span className="mt-1 block text-[11px] font-bold text-zinc-500">{t.employeeLocked}</span> : null}
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
            <input className={`${inputClass()} mt-2`} placeholder={t.customerNamePlaceholder} value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
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
            <span className="mt-1 block text-[11px] font-bold text-zinc-500">{paymentMethod === "cash" ? t.cashPaymentHint : t.transferPaymentHint}</span>
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
          <p className="mb-3 text-lg font-black text-zinc-950">{t.stepItems}</p>
          <input className={inputClass()} value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder={t.productSearch} />
          <div className="mt-4 rounded-lg border border-orange-100 bg-orange-50/60 p-3">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-700">{ui.quickAddProducts}</p>
                <p className="mt-1 text-xs font-bold text-orange-900">{ui.tapProductToAdd}</p>
              </div>
              <span className="text-xs font-black text-zinc-500">{filteredProducts.length} results</span>
            </div>
            {filteredProducts.length ? (
              <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-4">
                {filteredProducts.slice(0, 16).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProductToSlip(product)}
                    className="rounded-md border border-orange-100 bg-white p-3 text-left shadow-sm transition hover:border-orange-300 hover:bg-white"
                  >
                    <span className="block truncate text-[11px] font-black uppercase tracking-[0.1em] text-orange-600">{product.sku}</span>
                    <span className="mt-1 line-clamp-2 min-h-8 text-xs font-black leading-4 text-zinc-950">{product.name}</span>
                    {productMetaText(product) ? <span className="mt-1 block truncate text-[11px] font-bold text-zinc-500">{productMetaText(product)}</span> : null}
                    <span className="mt-2 block text-sm font-black text-zinc-700">{formatPhp(product.retailPrice ?? 0)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-orange-200 bg-white p-4 text-sm font-bold text-zinc-500">{ui.noProductResults}</p>
            )}
          </div>
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
                          {product.sku} - {product.name}{productMetaText(product) ? ` (${productMetaText(product)})` : ""}
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
                    <button
                      type="button"
                      className="rounded-md border border-red-200 px-3 py-2 text-xs font-black text-red-700"
                      onClick={() => setItems((current) => (current.length <= 1 ? [emptyItem()] : current.filter((_, rowIndex) => rowIndex !== index)))}
                    >
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
          <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.stepSubmit}</p>
          <p className="mt-1 text-3xl font-black text-[#f65f18]">{formatPhp(total)}</p>
          <p className="mt-1 text-sm font-bold text-zinc-500">
            {t.amountPreview}: {formatPhp(total)} · {paymentMethodLabel(paymentMethod, language)}
          </p>
        </div>
        <div className="w-full rounded-md border border-orange-100 bg-orange-50 p-3 md:max-w-xs">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-orange-700">{ui.orderBreakdown}</p>
          <div className="space-y-1 text-sm font-bold text-zinc-700">
            <div className="flex justify-between gap-3">
              <span>{ui.productTotal}</span>
              <span>{formatPhp(productTotal)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>{t.discount}</span>
              <span>{formatPhp(Number(discountAmount) || 0)}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-orange-200 pt-2 text-base font-black text-orange-700">
              <span>{ui.cashierReceives}</span>
              <span>{formatPhp(total)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <button type="button" onClick={() => setItems((current) => [...current, emptyItem()])} className="rounded-md border border-zinc-200 px-4 py-2.5 text-sm font-black text-zinc-700">
            {t.addManualItem}
          </button>
          <button type="button" disabled={!canSubmitSale} onClick={() => void saveSale()} className="rounded-md bg-[#f65f18] px-5 py-2.5 text-sm font-black text-white disabled:opacity-60">
            {editingSaleId ? actionText.updateSale : t.saveSale}
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
                <th className="px-4 py-3">{actionText.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sales.length ? (
                sales.map((sale) => {
                  const expanded = expandedSaleId === sale.id;

                  return (
                    <Fragment key={sale.id}>
                      <tr>
                        <td className="px-4 py-3 font-black text-zinc-950">{sale.saleNo}</td>
                        <td className="px-4 py-3 text-zinc-600">{sale.customerName}</td>
                        <td className="px-4 py-3 text-zinc-600">{paymentMethodLabel(sale.paymentMethod, language)}</td>
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
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedSaleId(expanded ? "" : sale.id)}
                              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-700"
                            >
                              {expanded ? t.hideDetails : t.details}
                            </button>
                            {sale.status === "waiting_cashier" || sale.status === "returned_to_sales" ? (
                              <>
                                <button type="button" onClick={() => loadSaleForEdit(sale)} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">
                                  {actionText.editSale}
                                </button>
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => void runSaleAction(sale, "cancel", actionText.cancelReasonPrompt, actionText.cancelDone)}
                                  className="rounded-md border border-red-200 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-60"
                                >
                                  {actionText.cancelSale}
                                </button>
                              </>
                            ) : null}
                            {canChangeEmployeeNo && sale.status === "paid" ? (
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => void runSaleAction(sale, "void_paid", actionText.voidReasonPrompt, actionText.voidDone)}
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-60"
                              >
                                {actionText.voidPaidSale}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr>
                          <td className="bg-zinc-50 px-4 py-4" colSpan={8}>
                            <div className="grid gap-4 xl:grid-cols-2">
                              <div className="rounded-md border border-zinc-200 bg-white p-4">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                  <h3 className="font-black text-zinc-950">{t.itemDetails}</h3>
                                  <div className="text-xs font-bold text-zinc-500">
                                    {t.productTotal}: {formatPhp(sale.productTotal)} | {t.discount}: {formatPhp(sale.discountAmount)}
                                  </div>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full min-w-[520px] text-left text-xs">
                                    <thead className="bg-zinc-50 uppercase tracking-[0.12em] text-zinc-500">
                                      <tr>
                                        <th className="px-3 py-2">{t.product}</th>
                                        <th className="px-3 py-2">SKU</th>
                                        <th className="px-3 py-2">{t.qty}</th>
                                        <th className="px-3 py-2">{t.unitPrice}</th>
                                        <th className="px-3 py-2">{t.subtotal}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                      {sale.items.map((item) => (
                                        <tr key={item.id}>
                                          <td className="px-3 py-2 font-black text-zinc-900">{item.name}</td>
                                          <td className="px-3 py-2 text-zinc-600">{item.sku || "-"}</td>
                                          <td className="px-3 py-2 text-zinc-600">{item.quantity}</td>
                                          <td className="px-3 py-2 text-zinc-600">{formatPhp(item.unitPrice)}</td>
                                          <td className="px-3 py-2 font-black text-zinc-900">{formatPhp(item.subtotal)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="mt-3 grid gap-2 text-xs font-bold text-zinc-600 sm:grid-cols-2">
                                  <p>
                                    {t.cashier}: {sale.cashierName || "-"}
                                  </p>
                                  <p>
                                    {t.saleNotes}: {sale.saleNotes || "-"}
                                  </p>
                                </div>
                              </div>
                              <div className="rounded-md border border-zinc-200 bg-white p-4">
                                <h3 className="mb-3 font-black text-zinc-950">{t.auditTrail}</h3>
                                {sale.auditLogs.length ? (
                                  <div className="space-y-2">
                                    {sale.auditLogs.map((log) => (
                                      <div key={log.id} className="rounded-md border border-zinc-100 bg-zinc-50 p-3 text-xs font-bold text-zinc-600">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <span className="font-black text-zinc-950">{auditActionLabel(log.action)}</span>
                                          <span>{shortDate(log.createdAt)}</span>
                                        </div>
                                        <p className="mt-1">
                                          {t.by}: {log.createdByName || "-"}
                                        </p>
                                        <p className="mt-1">
                                          {t.statusChange}: {log.previousStatus || "-"} {"->"} {log.newStatus || "-"}
                                        </p>
                                        <p className="mt-1">
                                          {t.reason}: {log.reason || "-"}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm font-bold text-zinc-500">{t.noAudit}</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-sm font-bold text-zinc-500" colSpan={8}>
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
