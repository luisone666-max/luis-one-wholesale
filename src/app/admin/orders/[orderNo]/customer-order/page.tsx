import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PackageSlipPrintButton } from "@/components/admin/PackageSlipPrintButton";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { getAdminOrders } from "@/lib/admin-orders-data";
import { businessInfo } from "@/lib/business-info";
import { formatPhp } from "@/lib/wholesale-pricing";

function shippingFeeLabel(order: Awaited<ReturnType<typeof getAdminOrders>>["orders"][number]) {
  if (order.shippingFeePayment === "freight_collect") {
    return "Paid to rider / receiver";
  }

  if (order.shippingFeePayment === "no_shipping_fee") {
    return "No shipping fee";
  }

  if (order.shippingFeeAmount === null) {
    return "To be confirmed";
  }

  return formatPhp(order.shippingFeeAmount);
}

export default async function CustomerOrderPage({ params }: { params: Promise<{ orderNo: string }> }) {
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

  const acceptedPayments = order.payments.filter((payment) => payment.status !== "rejected");
  const paidAmount = acceptedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = Math.max(0, order.amountToConfirm - paidAmount);
  const balanceLabel = order.receivingMethod === "courier_shipping" ? "Balance / COD" : "Balance";

  return (
    <main className="min-h-screen bg-zinc-100 p-4 text-zinc-950 print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          body { background: white; }
        }
      `}</style>
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between print:hidden">
        <Link href="/admin/orders" className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700">
          Back to Orders
        </Link>
        <PackageSlipPrintButton />
      </div>

      <section className="mx-auto max-w-3xl rounded-md border border-zinc-300 bg-white p-6 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-2 border-zinc-950 pb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Customer Order</p>
            <h1 className="mt-1 text-3xl font-black">{businessInfo.name}</h1>
            <p className="mt-2 text-sm font-bold text-zinc-600">{businessInfo.address}</p>
            <p className="text-sm font-bold text-zinc-600">{businessInfo.phoneDisplay}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Order No.</p>
            <p className="text-2xl font-black">{order.orderNo}</p>
            <p className="mt-1 text-sm font-bold text-zinc-600">{order.createdDate}</p>
          </div>
        </header>

        <section className="grid gap-4 border-b border-zinc-300 py-5 md:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Customer</p>
            <p className="mt-1 text-lg font-black">{order.customerName}</p>
            <p className="text-sm font-bold">{order.customerPhone || "-"}</p>
            <p className="mt-1 text-sm font-bold text-zinc-600">{order.facebookMessenger || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Receiver</p>
            <p className="mt-1 text-lg font-black">{order.receiverName || order.customerName}</p>
            <p className="text-sm font-bold">{order.receiverPhone || order.customerPhone || "-"}</p>
            <p className="mt-1 text-sm font-bold leading-snug">{order.completeAddress || "-"}</p>
          </div>
        </section>

        <section className="py-5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-zinc-950 text-xs uppercase tracking-[0.14em] text-zinc-500">
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3 text-right">Qty</th>
                <th className="py-2 pr-3 text-right">Unit</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-200">
                  <td className="py-3 pr-3 font-black">{item.variantSku || item.sku}</td>
                  <td className="py-3 pr-3 font-bold">
                    {item.name}
                    {item.variantName ? <span className="block text-xs text-zinc-500">Variant: {item.variantName}</span> : null}
                  </td>
                  <td className="py-3 pr-3 text-right font-black">{item.quantity}</td>
                  <td className="py-3 pr-3 text-right font-bold">{formatPhp(item.unitPrice)}</td>
                  <td className="py-3 text-right font-black">{formatPhp(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="ml-auto grid max-w-sm gap-2 border-t-2 border-zinc-950 pt-4 text-sm">
          <div className="flex justify-between gap-6">
            <span className="font-bold text-zinc-600">Product Total</span>
            <span className="font-black">{formatPhp(order.productTotal)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="font-bold text-zinc-600">Shipping</span>
            <span className="font-black">{shippingFeeLabel(order)}</span>
          </div>
          <div className="flex justify-between gap-6 border-t border-zinc-300 pt-2 text-base">
            <span className="font-black">Amount to Confirm</span>
            <span className="font-black">{formatPhp(order.amountToConfirm)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="font-bold text-zinc-600">Paid / Recorded</span>
            <span className="font-black">{formatPhp(paidAmount)}</span>
          </div>
          <div className="flex justify-between gap-6 rounded-md border-2 border-zinc-950 px-3 py-2 text-lg">
            <span className="font-black">{balanceLabel}</span>
            <span className="font-black">{formatPhp(balance)}</span>
          </div>
        </section>

        <footer className="mt-8 border-t border-zinc-300 pt-4 text-xs font-bold leading-relaxed text-zinc-600">
          <p>Thank you for ordering from {businessInfo.name}. Stock, delivery, and payment are confirmed by our team before fulfillment.</p>
          {order.orderNotes ? <p className="mt-2">Order notes: {order.orderNotes}</p> : null}
        </footer>
      </section>
    </main>
  );
}
