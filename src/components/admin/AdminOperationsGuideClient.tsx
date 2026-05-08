"use client";

import Link from "next/link";
import { useAdminI18n } from "@/components/admin/AdminShell";

const guide = {
  en: {
    eyebrow: "Daily workflow",
    title: "Operations Guide",
    intro:
      "Use this page as the staff map for Luis One Supply Hub. Sales creates the slip, Cashier confirms money, Owner/Admin reviews exceptions and reports.",
    sections: [
      {
        title: "Sales staff",
        items: [
          "Open Sales Desk before serving a walk-in customer.",
          "Enter your employee number, customer name, member customer when available, items, quantity, price, discount, and payment method.",
          "Save the sale slip and send the customer to Cashier for payment confirmation.",
          "If the slip is wrong before payment, edit or cancel your own waiting slip.",
          "If Cashier returns the slip, correct the issue and save it again.",
        ],
        links: [{ href: "/admin/sales-desk", label: "Open Sales Desk" }],
      },
      {
        title: "Cashier",
        items: [
          "Open Cashier Center to see waiting offline sales.",
          "Check the total amount and payment method before collecting money.",
          "Confirm payment only after cash, GCash, bank transfer, or other approved payment is received.",
          "Return the sale to Sales Desk if product, price, customer, or payment details are wrong.",
          "Use Cash Drawer to check today's cash and transfer totals separately.",
        ],
        links: [
          { href: "/admin/cashier", label: "Open Cashier Center" },
          { href: "/admin/cash-drawer", label: "Open Cash Drawer" },
        ],
      },
      {
        title: "Owner / Admin",
        items: [
          "Use Reports to review daily and monthly online orders, offline POS sales, payments, and staff performance.",
          "Use Staff Access to create, deactivate, and update staff roles and employee numbers.",
          "Paid sales should not be deleted. If a paid sale is wrong, void it with a reason so payment and points are reversed with an audit trail.",
          "Use Owner Center for high-permission actions and owner password changes.",
        ],
        links: [
          { href: "/admin/reports", label: "Open Reports" },
          { href: "/admin/staff", label: "Open Staff Access" },
          { href: "/admin/owner", label: "Open Owner Center" },
        ],
      },
      {
        title: "Warehouse / Product lookup",
        items: [
          "Use Products to check price, SKU, product image, stock status, MOQ, and variants.",
          "Warehouse accounts can manage product data when allowed, while sales/staff accounts only see price lookup.",
          "Unavailable products stay visible to customers for inquiry but cannot be ordered directly.",
        ],
        links: [{ href: "/admin/products", label: "Open Products" }],
      },
    ],
    rulesTitle: "Rules to keep data clean",
    rules: [
      "Do not share owner passwords with normal staff.",
      "Do not confirm payment before receiving money.",
      "Do not hard delete paid sales.",
      "Do not put supplier notes on customer-facing pages.",
      "Use member customer records when possible so points can be tracked.",
    ],
  },
  zh: {
    eyebrow: "每日流程",
    title: "操作指南",
    intro: "这页就是员工地图：销售开单，收银确认收款，老板/管理员看异常和报表。",
    sections: [
      {
        title: "销售员",
        items: [
          "接待线下客户时，先打开销售开单。",
          "输入工号、客户姓名、会员客户、商品、数量、价格、折扣和付款方式。",
          "保存销售单后，让客户到收银员那里确认付款。",
          "未收款前发现开错，可以修改或取消自己的等待收银销售单。",
          "如果收银员退回销售单，就修正问题后重新保存。",
        ],
        links: [{ href: "/admin/sales-desk", label: "打开销售开单" }],
      },
      {
        title: "收银员",
        items: [
          "打开收银中心，查看等待收款的线下销售单。",
          "收钱前先核对金额和付款方式。",
          "只有收到现金、GCash、银行转账或其他已允许的付款方式后，才能确认收款。",
          "如果商品、价格、客户或付款资料不对，就退回销售开单。",
          "打开钱箱查看今天现金和转账金额，现金和线上转账分开显示。",
        ],
        links: [
          { href: "/admin/cashier", label: "打开收银中心" },
          { href: "/admin/cash-drawer", label: "打开钱箱" },
        ],
      },
      {
        title: "老板 / 管理员",
        items: [
          "打开报表查看每日、每月线上订单、线下销售、收款、员工销售情况。",
          "打开员工权限，新增、停用、修改员工角色和工号。",
          "已收款销售单不要删除。如果开错，必须作废并填写原因，系统会冲销收款和积分并保留记录。",
          "老板中心用于最高权限操作和修改老板密码。",
        ],
        links: [
          { href: "/admin/reports", label: "打开报表" },
          { href: "/admin/staff", label: "打开员工权限" },
          { href: "/admin/owner", label: "打开老板中心" },
        ],
      },
      {
        title: "仓库 / 查价",
        items: [
          "打开商品查看价格、SKU、图片、库存状态、MOQ 和变体。",
          "仓库账号在允许时可以管理商品，销售/普通员工只看查价页面。",
          "无货商品可以显示给客户询问，但不能直接下单。",
        ],
        links: [{ href: "/admin/products", label: "打开商品" }],
      },
    ],
    rulesTitle: "保持数据干净的规则",
    rules: [
      "老板密码不要给普通员工。",
      "没有收到钱，不能确认收款。",
      "已收款销售单不要硬删除。",
      "供应商备注不要出现在客户前台。",
      "尽量选择会员客户，这样积分才能记录。",
    ],
  },
};

export function AdminOperationsGuideClient() {
  const { language } = useAdminI18n();
  const copy = guide[language];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">{copy.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black text-zinc-950 sm:text-3xl">{copy.title}</h1>
        <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-zinc-600">{copy.intro}</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {copy.sections.map((section) => (
          <section key={section.title} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-zinc-950">{section.title}</h2>
            <ol className="mt-4 space-y-2 text-sm font-semibold leading-6 text-zinc-600">
              {section.items.map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-50 text-xs font-black text-orange-700">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex flex-wrap gap-2">
              {section.links.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white hover:bg-orange-700">
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-zinc-950">{copy.rulesTitle}</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {copy.rules.map((rule) => (
            <div key={rule} className="rounded-md bg-zinc-50 px-4 py-3 text-sm font-black text-zinc-700">
              {rule}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
