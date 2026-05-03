import Link from "next/link";
import type { ReactNode } from "react";
import { CustomerAuthGate } from "@/components/auth/CustomerAuthGate";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { customerOrders } from "@/lib/customer-mock-data";

export default function MyOrdersPage() {
  return (
    <>
      <SiteHeader />
      <CustomerAuthGate>
        <main className="bg-zinc-50">
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 rounded-md border border-orange-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">My Orders</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Wholesale order history</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">Mock customer order history only.</p>
          </div>
          <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Order No</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Product Total</th>
                    <th className="px-4 py-3">Order Status</th>
                    <th className="px-4 py-3">Payment Status</th>
                    <th className="px-4 py-3">Receiving Method</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {customerOrders.map((order) => (
                    <tr key={order.orderNo}>
                      <td className="px-4 py-4 font-black text-zinc-950">{order.orderNo}</td>
                      <td className="px-4 py-4 text-zinc-600">{order.date}</td>
                      <td className="px-4 py-4 font-black text-orange-700">{order.productTotal}</td>
                      <td className="px-4 py-4"><Pill>{order.orderStatus}</Pill></td>
                      <td className="px-4 py-4"><Pill>{order.paymentStatus}</Pill></td>
                      <td className="px-4 py-4 text-zinc-600">{order.receivingMethod}</td>
                      <td className="px-4 py-4">
                        <Link href="/order-success" className="rounded-md border border-orange-200 px-3 py-2 text-xs font-black text-orange-700">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </section>
        </main>
      </CustomerAuthGate>
      <SiteFooter />
    </>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded bg-orange-50 px-2 py-1 text-xs font-black text-orange-700 ring-1 ring-orange-100">{children}</span>;
}
