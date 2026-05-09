"use client";

import Link from "next/link";
import { StatusPill } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";

type GuideLink = { href: string; label: string };
type GuideSection = {
  title: string;
  owner: string;
  goal: string;
  steps: string[];
  links: GuideLink[];
};

const guide = {
  en: {
    eyebrow: "Daily workflow",
    title: "Operations Guide",
    intro:
      "Use this page as the staff map for Luis One Supply Hub. Sales creates the slip, Cashier confirms money, Owner/Admin reviews exceptions and reports.",
    roleLabel: "Role",
    goalLabel: "Goal",
    openLabel: "Open",
    handoffTitle: "Handoff flow",
    handoffIntro: "Keep every transaction moving in one direction so sales, cashier, member points, and cash drawer totals stay clean.",
    rulesTitle: "Rules to keep data clean",
    sections: [
      {
        title: "Sales staff",
        owner: "Sales / Staff",
        goal: "Create accurate in-store sales slips and send them to Cashier.",
        steps: [
          "Open Sales Desk before serving a walk-in customer.",
          "Enter employee number, customer name, member customer when available, items, quantity, price, discount, and payment method.",
          "Use manual items only for offline products that are not yet in the website catalog.",
          "Save the sale slip and send the customer to Cashier for payment confirmation.",
          "If the slip is wrong before payment, edit or cancel your own waiting slip.",
        ],
        links: [{ href: "/admin/sales-desk", label: "Open Sales Desk" }],
      },
      {
        title: "Cashier",
        owner: "Cashier",
        goal: "Confirm money received and keep physical cash separate from transfers.",
        steps: [
          "Open Cashier Center to see waiting offline sales.",
          "Check customer, items, amount, payment method, and transfer reference before confirming.",
          "Confirm payment only after cash, GCash, bank transfer, or approved payment is received.",
          "Return the sale to Sales Desk if product, price, customer, or payment details are wrong.",
          "Use Cash Drawer to open change fund, record cash in/out, count cash, and close the day.",
        ],
        links: [
          { href: "/admin/cashier", label: "Open Cashier Center" },
          { href: "/admin/cash-drawer", label: "Open Cash Drawer" },
        ],
      },
      {
        title: "Owner / Admin",
        owner: "Owner / Admin",
        goal: "Review exceptions, staff performance, reports, products, and access.",
        steps: [
          "Use Dashboard to see pending online orders, waiting cashier slips, stock risk, and daily cash collection.",
          "Use Reports to review daily and monthly online orders, offline POS sales, payments, and staff performance.",
          "Use Staff Access to create, deactivate, and update staff roles and employee numbers.",
          "Do not hard delete paid sales. Void wrong paid sales with a reason so payment and points are reversed with an audit trail.",
          "Use Owner Center for high-permission actions and owner password changes.",
        ],
        links: [
          { href: "/admin", label: "Open Dashboard" },
          { href: "/admin/reports", label: "Open Reports" },
          { href: "/admin/staff", label: "Open Staff Access" },
          { href: "/admin/owner", label: "Open Owner Center" },
        ],
      },
      {
        title: "Warehouse / Product lookup",
        owner: "Warehouse / Sales",
        goal: "Check product price, availability, images, variants, and order readiness.",
        steps: [
          "Use Products to check SKU, price, image, stock status, MOQ, retail price, wholesale tiers, and variants.",
          "Sales and staff can use product lookup without touching sensitive admin functions.",
          "Unavailable products stay visible to customers for Messenger inquiry but cannot be ordered directly.",
          "Update product image, price, or stock through Product Management only when you have permission.",
        ],
        links: [{ href: "/admin/products", label: "Open Products" }],
      },
    ] satisfies GuideSection[],
    handoff: [
      "Sales Desk creates slip",
      "Cashier Center confirms payment",
      "Cash Drawer updates cash / transfer totals",
      "Member points are awarded after payment",
      "Reports show staff and store performance",
    ],
    rules: [
      "Do not share owner passwords with normal staff.",
      "Do not confirm payment before receiving money.",
      "Do not hard delete paid sales.",
      "Use return-to-sales or void paid sale when a mistake needs correction.",
      "Do not put supplier notes on customer-facing pages.",
      "Use member customer records when possible so points can be tracked.",
      "Cash and GCash / bank transfer must stay separated for daily closing.",
    ],
  },
  zh: {
    eyebrow: "\u6bcf\u65e5\u6d41\u7a0b",
    title: "\u64cd\u4f5c\u6307\u5357",
    intro:
      "\u8fd9\u4e00\u9875\u662f Luis One Supply Hub \u5458\u5de5\u5de5\u4f5c\u5730\u56fe\uff1a\u9500\u552e\u5f00\u5355\uff0c\u6536\u94f6\u786e\u8ba4\u6536\u5230\u94b1\uff0c\u8001\u677f / \u7ba1\u7406\u5458\u770b\u5f02\u5e38\u3001\u62a5\u8868\u548c\u6743\u9650\u3002",
    roleLabel: "\u89d2\u8272",
    goalLabel: "\u76ee\u6807",
    openLabel: "\u6253\u5f00",
    handoffTitle: "\u4ea4\u63a5\u6d41\u7a0b",
    handoffIntro:
      "\u6bcf\u7b14\u4ea4\u6613\u90fd\u6309\u540c\u4e00\u6761\u7ebf\u8d70\uff0c\u9500\u552e\u3001\u6536\u94f6\u3001\u79ef\u5206\u548c\u94b1\u7bb1\u6570\u636e\u624d\u4f1a\u5e72\u51c0\u3002",
    rulesTitle: "\u4fdd\u6301\u6570\u636e\u5e72\u51c0\u7684\u89c4\u5219",
    sections: [
      {
        title: "\u9500\u552e\u5458",
        owner: "\u9500\u552e / \u5458\u5de5",
        goal: "\u5f00\u51c6\u7ebf\u4e0b\u9500\u552e\u5355\uff0c\u7136\u540e\u4ea4\u7ed9\u6536\u94f6\u5458\u786e\u8ba4\u6536\u6b3e\u3002",
        steps: [
          "\u63a5\u5f85\u95e8\u5e97\u5ba2\u6237\u65f6\uff0c\u5148\u6253\u5f00\u9500\u552e\u5f00\u5355\u3002",
          "\u586b\u5199\u5de5\u53f7\u3001\u5ba2\u6237\u59d3\u540d\u3001\u4f1a\u5458\u5ba2\u6237\u3001\u5546\u54c1\u3001\u6570\u91cf\u3001\u4ef7\u683c\u3001\u6298\u6263\u548c\u6536\u6b3e\u65b9\u5f0f\u3002",
          "\u7f51\u7ad9\u5546\u54c1\u5e93\u6ca1\u6709\u7684\u7ebf\u4e0b\u5546\u54c1\uff0c\u624d\u4f7f\u7528\u624b\u52a8\u5546\u54c1\u3002",
          "\u4fdd\u5b58\u9500\u552e\u5355\uff0c\u8ba9\u5ba2\u6237\u5230\u6536\u94f6\u5458\u90a3\u91cc\u786e\u8ba4\u4ed8\u6b3e\u3002",
          "\u672a\u6536\u6b3e\u524d\u53d1\u73b0\u5f00\u9519\uff0c\u53ef\u4ee5\u4fee\u6539\u6216\u53d6\u6d88\u81ea\u5df1\u7684\u5f85\u6536\u94f6\u5355\u3002",
        ],
        links: [{ href: "/admin/sales-desk", label: "\u6253\u5f00\u9500\u552e\u5f00\u5355" }],
      },
      {
        title: "\u6536\u94f6\u5458",
        owner: "\u6536\u94f6\u5458",
        goal: "\u786e\u8ba4\u6536\u5230\u94b1\uff0c\u5e76\u628a\u5b9e\u4f53\u73b0\u91d1\u548c\u8f6c\u8d26\u5206\u5f00\u3002",
        steps: [
          "\u6253\u5f00\u6536\u94f6\u4e2d\u5fc3\uff0c\u67e5\u770b\u5f85\u6536\u6b3e\u7ebf\u4e0b\u9500\u552e\u5355\u3002",
          "\u786e\u8ba4\u524d\u5148\u6838\u5bf9\u5ba2\u6237\u3001\u5546\u54c1\u3001\u91d1\u989d\u3001\u6536\u6b3e\u65b9\u5f0f\u548c\u8f6c\u8d26\u53c2\u8003\u53f7\u3002",
          "\u53ea\u6709\u6536\u5230\u73b0\u91d1\u3001GCash\u3001\u94f6\u884c\u8f6c\u8d26\u6216\u5176\u4ed6\u5141\u8bb8\u6536\u6b3e\u540e\uff0c\u624d\u80fd\u786e\u8ba4\u3002",
          "\u5546\u54c1\u3001\u4ef7\u683c\u3001\u5ba2\u6237\u6216\u6536\u6b3e\u8d44\u6599\u4e0d\u5bf9\uff0c\u5c31\u9000\u56de\u9500\u552e\u53f0\u4fee\u6539\u3002",
          "\u7528\u94b1\u7bb1\u9875\u9762\u8bb0\u5f00\u5e97\u5907\u7528\u73b0\u91d1\u3001\u73b0\u91d1\u8fdb\u51fa\u3001\u70b9\u94b1\u548c\u5173\u8d26\u3002",
        ],
        links: [
          { href: "/admin/cashier", label: "\u6253\u5f00\u6536\u94f6\u4e2d\u5fc3" },
          { href: "/admin/cash-drawer", label: "\u6253\u5f00\u94b1\u7bb1" },
        ],
      },
      {
        title: "\u8001\u677f / \u7ba1\u7406\u5458",
        owner: "\u8001\u677f / \u7ba1\u7406\u5458",
        goal: "\u770b\u5f02\u5e38\u3001\u5458\u5de5\u4e1a\u7ee9\u3001\u62a5\u8868\u3001\u5546\u54c1\u548c\u6743\u9650\u3002",
        steps: [
          "\u4ece\u4eea\u8868\u76d8\u770b\u7ebf\u4e0a\u5f85\u8ddf\u8fdb\u8ba2\u5355\u3001\u5f85\u6536\u94f6\u5355\u3001\u7f3a\u8d27\u98ce\u9669\u548c\u4eca\u65e5\u5df2\u6536\u6b3e\u3002",
          "\u4ece\u62a5\u8868\u770b\u6bcf\u65e5 / \u6bcf\u6708\u7ebf\u4e0a\u8ba2\u5355\u3001\u7ebf\u4e0b POS\u3001\u6536\u6b3e\u548c\u5458\u5de5\u9500\u552e\u3002",
          "\u5728\u5458\u5de5\u6743\u9650\u91cc\u65b0\u589e\u3001\u505c\u7528\u3001\u4fee\u6539\u5458\u5de5\u89d2\u8272\u548c\u5de5\u53f7\u3002",
          "\u5df2\u6536\u6b3e\u5355\u4e0d\u8981\u786c\u5220\u3002\u5f00\u9519\u5c31\u4f5c\u5e9f\uff0c\u586b\u539f\u56e0\uff0c\u7cfb\u7edf\u4f1a\u51b2\u9500\u6536\u6b3e\u548c\u79ef\u5206\u5e76\u7559\u5ba1\u8ba1\u3002",
          "\u8001\u677f\u4e2d\u5fc3\u7528\u4e8e\u6700\u9ad8\u6743\u9650\u64cd\u4f5c\u548c\u4fee\u6539\u8001\u677f\u5bc6\u7801\u3002",
        ],
        links: [
          { href: "/admin", label: "\u6253\u5f00\u4eea\u8868\u76d8" },
          { href: "/admin/reports", label: "\u6253\u5f00\u62a5\u8868" },
          { href: "/admin/staff", label: "\u6253\u5f00\u5458\u5de5\u6743\u9650" },
          { href: "/admin/owner", label: "\u6253\u5f00\u8001\u677f\u4e2d\u5fc3" },
        ],
      },
      {
        title: "\u4ed3\u5e93 / \u67e5\u4ef7",
        owner: "\u4ed3\u5e93 / \u9500\u552e",
        goal: "\u67e5\u5546\u54c1\u4ef7\u683c\u3001\u5e93\u5b58\u3001\u56fe\u7247\u3001\u53d8\u4f53\u548c\u662f\u5426\u53ef\u4e0b\u5355\u3002",
        steps: [
          "\u7528\u5546\u54c1\u9875\u67e5 SKU\u3001\u4ef7\u683c\u3001\u56fe\u7247\u3001\u5e93\u5b58\u72b6\u6001\u3001MOQ\u3001\u96f6\u552e\u4ef7\u3001\u6279\u53d1\u9636\u68af\u548c\u53d8\u4f53\u3002",
          "\u9500\u552e\u548c\u666e\u901a\u5458\u5de5\u53ef\u4ee5\u53ea\u7528\u67e5\u4ef7\uff0c\u4e0d\u63a5\u89e6\u654f\u611f\u7ba1\u7406\u529f\u80fd\u3002",
          "\u65e0\u8d27\u5546\u54c1\u53ef\u4ee5\u7ed9\u5ba2\u6237\u770b\u548c\u95ee Messenger\uff0c\u4f46\u4e0d\u80fd\u76f4\u63a5\u4e0b\u5355\u3002",
          "\u53ea\u6709\u6709\u6743\u9650\u7684\u8d26\u53f7\u624d\u80fd\u66f4\u65b0\u5546\u54c1\u56fe\u7247\u3001\u4ef7\u683c\u548c\u5e93\u5b58\u3002",
        ],
        links: [{ href: "/admin/products", label: "\u6253\u5f00\u5546\u54c1" }],
      },
    ] satisfies GuideSection[],
    handoff: [
      "\u9500\u552e\u5f00\u5355",
      "\u6536\u94f6\u786e\u8ba4\u6536\u6b3e",
      "\u94b1\u7bb1\u66f4\u65b0\u73b0\u91d1 / \u8f6c\u8d26",
      "\u6536\u6b3e\u540e\u81ea\u52a8\u7ed9\u4f1a\u5458\u79ef\u5206",
      "\u62a5\u8868\u663e\u793a\u5458\u5de5\u548c\u95e8\u5e97\u4e1a\u7ee9",
    ],
    rules: [
      "\u8001\u677f\u5bc6\u7801\u4e0d\u8981\u7ed9\u666e\u901a\u5458\u5de5\u3002",
      "\u6ca1\u6709\u6536\u5230\u94b1\uff0c\u4e0d\u80fd\u786e\u8ba4\u6536\u6b3e\u3002",
      "\u5df2\u6536\u6b3e\u5355\u4e0d\u8981\u786c\u5220\u3002",
      "\u5f00\u9519\u5355\u7528\u9000\u56de\u9500\u552e\u6216\u4f5c\u5e9f\u5df2\u6536\u6b3e\u5355\u6765\u5904\u7406\u3002",
      "\u4f9b\u5e94\u5546\u5907\u6ce8\u4e0d\u8981\u51fa\u73b0\u5728\u5ba2\u6237\u524d\u53f0\u3002",
      "\u5c3d\u91cf\u9009\u4f1a\u5458\u5ba2\u6237\uff0c\u8fd9\u6837\u79ef\u5206\u624d\u80fd\u8ddf\u8e2a\u3002",
      "\u73b0\u91d1\u548c GCash / \u94f6\u884c\u8f6c\u8d26\u8981\u5206\u5f00\uff0c\u65b9\u4fbf\u65e5\u7ed3\u5bf9\u8d26\u3002",
    ],
  },
};

function GuideButton({ href, label }: GuideLink) {
  return (
    <Link href={href} className="rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white hover:bg-orange-700">
      {label}
    </Link>
  );
}

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

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">{copy.handoffTitle}</p>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-zinc-600">{copy.handoffIntro}</p>
          </div>
          <StatusPill tone="green">POS</StatusPill>
        </div>
        <div className="mt-5 grid gap-2 md:grid-cols-5">
          {copy.handoff.map((step, index) => (
            <div key={step} className="rounded-md border border-orange-100 bg-orange-50 px-3 py-3 text-sm font-black text-orange-900">
              <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-white text-xs text-orange-700">{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {copy.sections.map((section) => (
          <section key={section.title} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">{copy.roleLabel}</p>
                <h2 className="mt-1 text-lg font-black text-zinc-950">{section.title}</h2>
                <p className="mt-2 text-sm font-black text-orange-700">
                  {copy.goalLabel}: {section.goal}
                </p>
              </div>
              <StatusPill tone="neutral">{section.owner}</StatusPill>
            </div>
            <ol className="mt-4 space-y-2 text-sm font-semibold leading-6 text-zinc-600">
              {section.steps.map((item, index) => (
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
                <GuideButton key={link.href} {...link} />
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
