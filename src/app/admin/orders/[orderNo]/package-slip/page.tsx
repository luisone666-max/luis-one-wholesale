import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PackageSlipPrintButton } from "@/components/admin/PackageSlipPrintButton";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { getAdminOrders } from "@/lib/admin-orders-data";
import { businessInfo } from "@/lib/business-info";
import { formatPhp } from "@/lib/wholesale-pricing";

function packageSize(shipment: NonNullable<Awaited<ReturnType<typeof getAdminOrders>>["orders"][number]["shipments"][number]> | undefined) {
  if (!shipment?.packageLengthCm || !shipment.packageWidthCm || !shipment.packageHeightCm) {
    return "-";
  }

  return `${shipment.packageLengthCm} x ${shipment.packageWidthCm} x ${shipment.packageHeightCm} cm`;
}

function packageWeight(shipment: NonNullable<Awaited<ReturnType<typeof getAdminOrders>>["orders"][number]["shipments"][number]> | undefined) {
  return shipment?.packageWeightGrams ? `${shipment.packageWeightGrams} g` : "-";
}

export default async function PackageSlipPage({ params }: { params: Promise<{ orderNo: string }> }) {
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
  const codAmount = shipment?.codAmount ?? order.amountToConfirm;

  return (
    <main className="min-h-screen bg-zinc-100 p-4 text-zinc-950 print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { size: A6 portrait; margin: 8mm; }
          body { background: white; }
        }
      `}</style>
      <div className="mx-auto mb-4 flex max-w-[520px] items-center justify-between print:hidden">
        <Link href="/admin/orders" className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700">
          Back to Orders
        </Link>
        <PackageSlipPrintButton />
      </div>
      <section className="mx-auto max-w-[520px] rounded-md border border-zinc-300 bg-white p-5 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-b-2 border-zinc-950 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">COD Package Slip</p>
              <h1 className="mt-1 text-2xl font-black">{businessInfo.name}</h1>
              <p className="mt-1 text-xs font-bold text-zinc-600">{businessInfo.address}</p>
              <p className="text-xs font-bold text-zinc-600">{businessInfo.phoneDisplay}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Order</p>
              <p className="text-lg font-black">{order.orderNo}</p>
              <p className="text-xs font-bold text-zinc-600">{order.createdDate}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-3 border-b border-zinc-300 py-4">
          <div className="rounded-md border-2 border-zinc-950 p-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Collect COD</p>
            <p className="mt-1 text-3xl font-black">{formatPhp(codAmount)}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Receiver</p>
            <p className="mt-1 text-lg font-black">{shipment?.receiverName || order.receiverName || order.customerName}</p>
            <p className="text-sm font-bold">{shipment?.receiverPhone || order.receiverPhone || order.customerPhone}</p>
            <p className="mt-1 text-sm font-bold leading-snug">{shipment?.receiverAddress || order.completeAddress}</p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 border-b border-zinc-300 py-4 text-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Courier</p>
            <p className="font-black uppercase">{shipment?.provider || "J&T"}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Status</p>
            <p className="font-black">{shipment?.status || "draft"}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Weight</p>
            <p className="font-black">{packageWeight(shipment)}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Size</p>
            <p className="font-black">{packageSize(shipment)}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Tracking</p>
            <p className="font-black">{shipment?.trackingNo || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Waybill</p>
            <p className="font-black">{shipment?.waybillNo || "-"}</p>
          </div>
        </section>

        <section className="py-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Items</p>
          <table className="mt-2 w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-300">
                <th className="py-1 pr-2">SKU</th>
                <th className="py-1 pr-2">Item</th>
                <th className="py-1 text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100">
                  <td className="py-1 pr-2 font-black">{item.variantSku || item.sku}</td>
                  <td className="py-1 pr-2 font-bold">
                    {item.name}
                    {item.variantName ? <span className="block text-[10px] text-zinc-500">{item.variantName}</span> : null}
                  </td>
                  <td className="py-1 text-right font-black">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {shipment?.notes ? (
          <section className="border-t border-zinc-300 pt-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Notes</p>
            <p className="mt-1 text-xs font-bold leading-snug">{shipment.notes}</p>
          </section>
        ) : null}
      </section>
    </main>
  );
}
