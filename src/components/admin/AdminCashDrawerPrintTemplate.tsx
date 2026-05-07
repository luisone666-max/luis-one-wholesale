"use client";

import { businessInfo } from "@/lib/business-info";
import type { CashDrawerData } from "@/lib/cash-drawer-data";
import { formatPhp } from "@/lib/wholesale-pricing";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-zinc-200 py-1 text-[8px] font-bold">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-950">{value}</span>
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-zinc-300 p-1.5">
      <h2 className="mb-1 text-[8px] font-black uppercase tracking-wide text-zinc-500">{title}</h2>
      {children}
    </div>
  );
}

function paymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    cash: "Cash",
    gcash: "GCash",
    bank_transfer: "Bank Transfer",
    other: "Other",
  };

  return labels[method] ?? method;
}

export function AdminCashDrawerPrintTemplate({ data }: { data: CashDrawerData }) {
  const session = data.session;
  const difference = session?.differenceAmount ?? null;
  const actualCash = session?.actualCash ?? null;

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

          .a6-cash-drawer-sheet,
          .a6-cash-drawer-sheet * {
            visibility: visible;
          }

          .a6-cash-drawer-sheet {
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

      <div className="a6-cash-drawer-sheet">
        <div className="flex items-start justify-between gap-2 border-b border-zinc-950 pb-1.5">
          <div className="min-w-0">
            <h1 className="text-[13px] font-black uppercase leading-4">{businessInfo.name}</h1>
            <p className="text-[8px] font-bold uppercase tracking-wide text-zinc-600">Daily Cash Drawer Summary</p>
            <p className="mt-0.5 text-[7px] font-bold text-zinc-500">{businessInfo.address}</p>
            <p className="text-[7px] font-bold text-zinc-500">{businessInfo.phoneDisplay}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black">{data.businessDate}</p>
            <p className="mt-1 text-[7px] font-black uppercase text-orange-700">{session?.status ?? "No Session"}</p>
          </div>
        </div>

        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <Box title="Physical Cash">
            <Row label="Opening Cash" value={formatPhp(session?.openingCash ?? 0)} />
            <Row label="Cash Sales" value={formatPhp(data.cashSalesTotal)} />
            <Row label="Cash In" value={formatPhp(data.cashInAdjustmentTotal)} />
            <Row label="Cash Out" value={formatPhp(data.cashOutTotal)} />
            <Row label="Expected Cash" value={formatPhp(data.expectedCash)} />
            <Row label="Actual Cash" value={actualCash === null ? "-" : formatPhp(actualCash)} />
            <Row label="Difference" value={difference === null ? "-" : formatPhp(difference)} />
          </Box>
          <Box title="Non-Cash Payments">
            <Row label="GCash" value={formatPhp(data.gcashSalesTotal)} />
            <Row label="Bank Transfer" value={formatPhp(data.bankTransferSalesTotal)} />
            <Row label="Other" value={formatPhp(data.otherSalesTotal)} />
            <Row label="Total Non-Cash" value={formatPhp(data.transferSalesTotal + data.otherSalesTotal)} />
            <Row label="Offline Total" value={formatPhp(data.offlineSalesTotal)} />
          </Box>
        </div>

        <Box title="Payment Breakdown">
          {data.paymentBreakdown.length ? (
            data.paymentBreakdown.map((payment) => <Row key={payment.method} label={paymentMethodLabel(payment.method)} value={formatPhp(payment.amount)} />)
          ) : (
            <p className="text-[8px] font-bold text-zinc-500">No cashier payments.</p>
          )}
        </Box>

        <Box title="Cash Entries">
          {data.entries.length ? (
            data.entries.slice(0, 8).map((entry) => (
              <div key={entry.id} className="border-b border-zinc-200 py-1 text-[8px]">
                <div className="flex justify-between gap-2 font-black">
                  <span>{entry.entryType === "cash_out" ? "Cash Out" : "Cash In"}</span>
                  <span>{formatPhp(entry.amount)}</span>
                </div>
                <p className="font-bold text-zinc-600">{entry.reason || "-"}</p>
              </div>
            ))
          ) : (
            <p className="text-[8px] font-bold text-zinc-500">No cash entries.</p>
          )}
        </Box>

        <div className="mt-3 grid grid-cols-2 gap-4 text-[8px] font-bold">
          <div>
            <div className="h-6 border-b border-zinc-500" />
            <p className="mt-1">Cashier Sign</p>
          </div>
          <div>
            <div className="h-6 border-b border-zinc-500" />
            <p className="mt-1">Owner / Manager Sign</p>
          </div>
        </div>
      </div>
    </section>
  );
}
