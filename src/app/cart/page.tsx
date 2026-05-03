import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { formatMoney, getActiveProducts, getTierForQuantity } from "@/lib/mock-data";

const products = getActiveProducts();
const cartItems = [
  { product: products[0], quantity: 12 },
  { product: products[3], quantity: 50 },
  { product: products[5], quantity: 6 },
];

export default function CartPage() {
  const total = cartItems.reduce((sum, item) => sum + getTierForQuantity(item.product, item.quantity).price * item.quantity, 0);

  return (
    <>
      <SiteHeader />
      <main className="bg-zinc-50">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 rounded-md border border-orange-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Order cart mockup</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Draft wholesale order</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
              This page previews how a future order cart can look. It does not submit orders, process payment, or
              create shipping records.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
              <div className="grid grid-cols-[1fr_120px_130px] gap-4 border-b border-zinc-100 bg-zinc-50 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-500 max-md:hidden">
                <span>Product</span>
                <span>Quantity</span>
                <span className="text-right">Subtotal</span>
              </div>
              <div className="divide-y divide-zinc-100">
                {cartItems.map(({ product, quantity }) => {
                  const tier = getTierForQuantity(product, quantity);
                  const subtotal = tier.price * quantity;

                  return (
                    <div key={product.slug} className="grid gap-4 p-5 md:grid-cols-[1fr_120px_130px] md:items-center">
                      <div className="flex gap-4">
                        <div className="h-24 w-24 shrink-0 rounded-md bg-orange-50 p-2">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={120}
                            height={120}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div>
                          <Link href={`/product/${product.slug}`} className="font-black text-zinc-950 hover:text-orange-700">
                            {product.name}
                          </Link>
                          <p className="mt-2 text-sm text-zinc-600">{tier.label} · {formatMoney(tier.price)} per pc</p>
                          <p className="mt-1 text-xs font-bold text-emerald-600">{product.stockStatus}</p>
                        </div>
                      </div>
                      <div className="rounded-md border border-zinc-200 px-3 py-2 text-center text-sm font-black text-zinc-900">
                        {quantity} pcs
                      </div>
                      <div className="text-right text-lg font-black text-[#f65f18]">{formatMoney(subtotal)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="h-fit rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-zinc-950">Order summary</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Items</span>
                  <span className="font-bold text-zinc-950">{cartItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Product total</span>
                  <span className="font-bold text-zinc-950">{formatMoney(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Shipping</span>
                  <span className="font-bold text-zinc-950">Manual quote</span>
                </div>
                <div className="border-t border-zinc-100 pt-4">
                  <div className="flex justify-between">
                    <span className="font-black text-zinc-950">Estimated subtotal</span>
                    <span className="text-2xl font-black text-[#f65f18]">{formatMoney(total)}</span>
                  </div>
                </div>
              </div>
              <Link
                href="/login"
                className="mt-6 block rounded-md bg-[#f65f18] px-5 py-3 text-center text-sm font-black text-white"
              >
                Login to Place Order Later
              </Link>
              <p className="mt-3 rounded-md bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-700">
                Order submission is intentionally not built in this first frontend version.
              </p>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
