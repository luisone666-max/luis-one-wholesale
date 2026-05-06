"use client";

import type { PosSaleRecord } from "@/lib/pos-data";
import { businessInfo } from "@/lib/business-info";
import { formatPhp } from "@/lib/wholesale-pricing";

function paymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    cash: "Cash",
    gcash: "GCash",
    bank_transfer: "Bank Transfer",
    other: "Other",
  };

  return labels[method] ?? method;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    waiting_cashier: "Waiting Cashier",
    paid: "Paid",
    cancelled: "Cancelled",
  };

  return labels[status] ?? status;
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function A6Box({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-sm border border-zinc-300 p-1.5 ${className}`}>
      <h2 className="mb-1 text-[8px] font-black uppercase tracking-wide text-zinc-500">{title}</h2>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function A6Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[18mm_1fr] gap-1 text-[8px]">
      <span className="font-bold text-zinc-500">{label}</span>
      <span className="break-words font-semibold text-zinc-900">{value || "-"}</span>
    </div>
  );
}

function A6Check({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1 text-[8px] font-bold">
      <span className="inline-block h-[7px] w-[7px] border border-zinc-700" />
      <span>{label}</span>
    </div>
  );
}

function A6Total({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-1 py-0.5 text-[8px] ${strong ? "font-black" : "font-bold"}`}>
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export function AdminPosSalePrintTemplate({ sale }: { sale: PosSaleRecord | null }) {
  if (!sale) {
    return null;
  }

  return (
    <section className="hidden bg-white text-zinc-950 print:block">
      <style>{`
        @media print {
          @page {
            size: 105mm 148mm;
            margin: 4mm;
          }

          html,
          body {
            width: 105mm;
            min-height: 148mm;
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * {
            visibility: hidden;
          }

          .a6-pos-sale-sheet,
          .a6-pos-sale-sheet * {
            visibility: visible;
          }

          .a6-pos-sale-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 97mm;
            max-width: 97mm;
            min-height: 140mm;
            margin: 0;
            font-family: Arial, sans-serif;
            font-size: 9px;
            line-height: 1.25;
            color: #111827;
          }
        }
      `}</style>

      <div className="a6-pos-sale-sheet">
        <div className="flex items-start justify-between gap-2 border-b border-zinc-950 pb-1.5">
          <div className="min-w-0">
            <h1 className="text-[13px] font-black uppercase leading-4">{businessInfo.name}</h1>
            <p className="text-[8px] font-bold uppercase tracking-wide text-zinc-600">Offline POS Sales Slip</p>
            <p className="mt-0.5 text-[7px] font-bold text-zinc-500">{businessInfo.address}</p>
            <p className="text-[7px] font-bold text-zinc-500">{businessInfo.phoneDisplay} | {businessInfo.hours}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black">{sale.saleNo}</p>
            <p className="text-[8px] font-bold text-zinc-600">{formatDate(sale.createdAt)}</p>
            <p className="mt-1 text-[7px] font-black uppercase text-orange-700">{statusLabel(sale.status)}</p>
          </div>
        </div>

        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <A6Box title="Customer">
            <A6Row label="Name" value={sale.customerName} />
            <A6Row label="Phone" value={sale.customerPhone} />
            <A6Row label="Member" value={sale.customerIsMember ? "Yes" : "No"} />
          </A6Box>
          <A6Box title="Staff / Payment">
            <A6Row label="Sales" value={sale.salespersonName || sale.salespersonEmployeeNo} />
            <A6Row label="Employee No" value={sale.salespersonEmployeeNo} />
            <A6Row label="Method" value={paymentMethodLabel(sale.paymentMethod)} />
          </A6Box>
        </div>

        {(sale.priceChangeNotes || sale.saleNotes) ? (
          <A6Box title="Notes" className="mt-1.5">
            {sale.priceChangeNotes ? <p className="break-words font-bold">Price: {sale.priceChangeNotes}</p> : null}
            {sale.saleNotes ? <p className="break-words text-zinc-600">Sale: {sale.saleNotes}</p> : null}
          </A6Box>
        ) : null}

        <div className="mt-1.5 overflow-hidden border border-zinc-400">
          <table className="w-full table-fixed text-left text-[8px]">
            <thead className="bg-zinc-100 font-black uppercase text-zinc-700">
              <tr>
                <th className="w-[22mm] border-r border-zinc-400 px-1 py-1">SKU</th>
                <th className="border-r border-zinc-400 px-1 py-1">Item</th>
                <th className="w-[9mm] border-r border-zinc-400 px-1 py-1 text-center">Qty</th>
                <th className="w-[18mm] px-1 py-1 text-right">Sub</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-t border-zinc-300">
                  <td className="break-words border-r border-zinc-300 px-1 py-1 font-bold">{item.sku}</td>
                  <td className="border-r border-zinc-300 px-1 py-1">
                    <span className="line-clamp-2 font-bold">{item.name}</span>
                    {item.notes ? <span className="block break-words text-[7px] text-zinc-600">Note: {item.notes}</span> : null}
                    <span className="block text-[7px] text-zinc-500">{formatPhp(item.unitPrice)} each</span>
                  </td>
                  <td className="border-r border-zinc-300 px-1 py-1 text-center font-black">{item.quantity}</td>
                  <td className="px-1 py-1 text-right font-black">{formatPhp(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-1.5 grid grid-cols-[1fr_37mm] gap-1.5">
          <A6Box title="Cashier Checklist">
            <A6Check label="Amount checked" />
            <A6Check label="Cash / transfer received" />
            <A6Check label="Reference number checked" />
            <A6Check label="Items released" />
          </A6Box>
          <A6Box title="Total">
            <A6Total label="Product" value={formatPhp(sale.productTotal)} />
            <A6Total label="Discount" value={formatPhp(sale.discountAmount)} />
            <div className="mt-1 border-t border-zinc-300 pt-1">
              <A6Total label="Due" value={formatPhp(sale.totalAmount)} strong />
            </div>
          </A6Box>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4 text-[8px] font-bold">
          <div>
            <div className="h-6 border-b border-zinc-500" />
            <p className="mt-1">Cashier Sign</p>
          </div>
          <div>
            <div className="h-6 border-b border-zinc-500" />
            <p className="mt-1">Customer Sign</p>
          </div>
        </div>
      </div>
    </section>
  );
}
