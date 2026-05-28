import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PackageSlipPrintButton } from "@/components/admin/PackageSlipPrintButton";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { getAdminOrders } from "@/lib/admin-orders-data";
import { businessInfo } from "@/lib/business-info";
import { formatPhp } from "@/lib/wholesale-pricing";

function cleanTracking(value: string | undefined) {
  return value?.trim() || "PENDING";
}

function packageSize(shipment: Awaited<ReturnType<typeof getAdminOrders>>["orders"][number]["shipments"][number] | undefined) {
  if (!shipment?.packageLengthCm || !shipment.packageWidthCm || !shipment.packageHeightCm) {
    return "-";
  }

  return `${shipment.packageLengthCm} x ${shipment.packageWidthCm} x ${shipment.packageHeightCm} cm`;
}

function packageWeight(shipment: Awaited<ReturnType<typeof getAdminOrders>>["orders"][number]["shipments"][number] | undefined) {
  return shipment?.packageWeightGrams ? `${shipment.packageWeightGrams} g` : "-";
}

export default async function WaybillPage({ params }: { params: Promise<{ orderNo: string }> }) {
  const admin = await requireActiveAdminPage();

  if (admin.role !== "owner" && admin.role !== "admin" && admin.role !== "warehouse") {
    redirect("/admin");
  }

  const { orderNo } = await params;
  const result = await getAdminOrders();
  const order = result.orders.find((item) => item.orderNo === decodeURIComponent(orderNo));

  if (!order) {
    notFound();
  }

  const shipment = order.shipments[0];
  const trackingNo = cleanTracking(shipment?.trackingNo || shipment?.waybillNo || shipment?.bookingReference);
  const codAmount = shipment?.codAmount ?? order.amountToConfirm;
  const isLalamove = order.receivingMethod === "local_delivery" || order.receivingMethod === "local_delivery_lalamove";
  const customerBooksLalamove = isLalamove && order.orderNotes.includes("Customer will book");
  const providerName = shipment?.provider || (isLalamove ? "Lalamove" : "J&T");
  const serviceLabel = isLalamove ? (customerBooksLalamove ? "Customer-booked Lalamove" : "Manual Lalamove") : "COD Delivery";
  const amountLabel = isLalamove ? "Order Amount" : "COD Amount";

  return (
    <main className="min-h-screen bg-zinc-100 p-4 text-zinc-950 print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { size: 100mm 150mm; margin: 5mm; }
          body { background: white; }
        }
      `}</style>
      <div className="mx-auto mb-4 flex max-w-[420px] items-center justify-between gap-3 print:hidden">
        <Link href="/admin/orders" className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700">
          Back to Orders
        </Link>
        <div className="flex gap-2">
          {shipment?.labelUrl ? (
            <Link href={shipment.labelUrl} target="_blank" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
              Official Label
            </Link>
          ) : null}
          <PackageSlipPrintButton />
        </div>
      </div>

      <section className="mx-auto flex min-h-[142mm] max-w-[420px] flex-col rounded-md border-2 border-zinc-950 bg-white p-4 shadow-sm print:min-h-0 print:max-w-none print:border-0 print:p-0 print:shadow-none">
        {!shipment?.labelUrl ? (
          <div className="mb-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-center text-[10px] font-black uppercase tracking-[0.12em] text-amber-800 print:border-zinc-400 print:bg-white print:text-zinc-700">
            Local waybill - official J&T label pending
          </div>
        ) : null}

        <header className="border-b-2 border-zinc-950 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Courier Waybill</p>
              <h1 className="mt-1 text-2xl font-black uppercase">{providerName}</h1>
              <p className="text-xs font-bold text-zinc-600">{serviceLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Order</p>
              <p className="text-base font-black">{order.orderNo}</p>
              <p className="text-[11px] font-bold text-zinc-600">{order.createdDate}</p>
            </div>
          </div>
        </header>

        <section className="border-b-2 border-zinc-950 py-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Tracking / Waybill No.</p>
          <p className="mt-1 break-all text-3xl font-black tracking-[0.08em]">{trackingNo}</p>
          <div className="mt-2 h-10 w-full bg-[repeating-linear-gradient(90deg,#111_0,#111_2px,#fff_2px,#fff_5px,#111_5px,#111_6px,#fff_6px,#fff_10px)]" />
        </section>

        <section className="grid grid-cols-2 border-b border-zinc-300 text-sm">
          <div className="border-r border-zinc-300 p-2">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{amountLabel}</p>
            <p className="mt-1 text-xl font-black">{formatPhp(codAmount)}</p>
          </div>
          <div className="p-2">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Parcel</p>
            <p className="mt-1 font-black">{packageWeight(shipment)}</p>
            <p className="text-xs font-bold">{packageSize(shipment)}</p>
          </div>
        </section>

        <section className="border-b border-zinc-300 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Ship To</p>
          <p className="mt-1 text-xl font-black">{shipment?.receiverName || order.receiverName || order.customerName}</p>
          <p className="text-sm font-black">{shipment?.receiverPhone || order.receiverPhone || order.customerPhone}</p>
          <p className="mt-1 text-sm font-bold leading-snug">{shipment?.receiverAddress || order.completeAddress}</p>
        </section>

        <section className="border-b border-zinc-300 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Ship From</p>
          <p className="mt-1 text-sm font-black">{shipment?.senderName || businessInfo.name}</p>
          <p className="text-xs font-bold">{shipment?.senderPhone || businessInfo.phoneDisplay}</p>
          <p className="text-xs font-bold leading-snug">{shipment?.senderAddress || businessInfo.address}</p>
        </section>

        <section className="grid flex-1 grid-cols-2 gap-2 py-3 text-xs">
          <div>
            <p className="font-black uppercase tracking-[0.12em] text-zinc-500">Items</p>
            <p className="mt-1 font-bold">{order.items.reduce((sum, item) => sum + item.quantity, 0)} pcs</p>
          </div>
          <div>
            <p className="font-black uppercase tracking-[0.12em] text-zinc-500">Status</p>
            <p className="mt-1 font-bold">{shipment?.status || "draft"}</p>
          </div>
          <div className="col-span-2">
            <p className="font-black uppercase tracking-[0.12em] text-zinc-500">Notes</p>
            <p className="mt-1 line-clamp-3 font-bold">{shipment?.notes || order.orderNotes || "-"}</p>
          </div>
        </section>

        <footer className="border-t-2 border-zinc-950 pt-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
          {isLalamove ? "Manual handover - no automatic booking" : "Verify COD before handover"}
        </footer>
      </section>
    </main>
  );
}
