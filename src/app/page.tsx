import Link from "next/link";
import Image from "next/image";
import { CategoryGrid, Container, MarketplaceShell, MessengerButton, PrimaryButton, SecondaryButton } from "@/components/CustomerUi";
import { DataSourceNotice } from "@/components/DataSourceNotice";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCatalogSnapshot } from "@/lib/catalog-data";

const rules = [
  { title: "Public prices", text: "Browse wholesale prices and MOQ before login." },
  { title: "MOQ / bulk price", text: "Quantity tiers apply automatically in cart." },
  { title: "Deposit may be required", text: "We confirm deposit manually after order review." },
  { title: "Freight collect available", text: "Shipping fee can be paid by receiver." },
  { title: "Pick-up / Lalamove / Courier", text: "Receiving method is selected during checkout." },
  { title: "Manual order confirmation", text: "Our team reviews stock, deposit, pickup, and delivery details." },
  { title: "No online payment", text: "Payment is arranged after confirmation, not on the website." },
];

const trustItems = [
  { title: "For resellers and shops", text: "Built for repeat B2B buyers, not casual retail checkout." },
  { title: "Bulk pricing", text: "Price tiers make larger quantity decisions clear before ordering." },
  { title: "Fast order confirmation", text: "Our team confirms stock, sourcing, deposit, and receiving details." },
  { title: "Messenger support", text: "Ask about any product before placing a wholesale order." },
];

export default async function Home() {
  const catalog = await getCatalogSnapshot();
  const categories = catalog.data.categories;
  const products = catalog.data.products;
  const bestSellers = [...products].sort((a, b) => b.sold - a.sold).slice(0, 6);
  const newArrivals = [...products].slice(-6).reverse();
  const readyStock = products.filter((product) => product.stockStatus === "In stock").slice(0, 6);
  const forOrder = products.filter((product) => product.stockStatus === "Preorder").slice(0, 6);

  return (
    <>
      <SiteHeader />
      <DataSourceNotice message={catalog.message} />
      <MarketplaceShell>
        <section className="border-b border-orange-100 bg-white">
          <Container className="grid gap-5 py-6 lg:grid-cols-[1fr_320px]">
            <div className="overflow-hidden rounded-sm bg-zinc-950 text-white shadow-sm ring-1 ring-zinc-900">
              <div className="grid min-h-[390px] gap-6 p-7 md:grid-cols-[1fr_320px] md:items-center lg:p-10">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-sm bg-white/8 px-3 py-2 ring-1 ring-white/15">
                    <span className="grid h-8 w-8 overflow-hidden rounded-full bg-white">
                      <Image src="/brand/luis-one-logo.jpg" alt="Luis One Supply Hub logo" width={32} height={32} className="h-full w-full object-cover" />
                    </span>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-100">Luis One Supply Hub</p>
                  </div>
                  <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
                    Wholesale Supply for Resellers & Shops
                  </h1>
                  <p className="mt-4 max-w-xl text-base leading-7 text-orange-50">
                    Motorcycle Parts, Daily Essentials, Electronics, Food & Spices - Bulk Pricing Available.
                  </p>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-200">
                    Browse products, check public wholesale prices, register your account, and submit wholesale orders online. Our team will confirm your order, deposit, pickup, or delivery arrangement manually.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <PrimaryButton href="/category/all" className="bg-white text-[#f65f18] hover:bg-orange-50">View Products</PrimaryButton>
                    <SecondaryButton href="/register" className="border-white/40 bg-white/5 text-white hover:bg-white hover:text-[#f65f18]">Register to Order</SecondaryButton>
                    <MessengerButton className="border-white/40 bg-white/5 text-white hover:bg-white hover:text-[#f65f18]" />
                  </div>
                  <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-center">
                    {["Public Prices", "Manual Check", "Freight Collect"].map((item) => (
                      <div key={item} className="rounded-sm bg-white/8 px-3 py-3 ring-1 ring-white/15">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-100">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-sm border border-white/10 bg-white p-4 text-zinc-950 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Today&apos;s supply picks</p>
                    <span className="rounded-sm bg-zinc-950 px-2 py-1 text-[10px] font-black text-white">PH B2B</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {products.slice(0, 4).map((product) => (
                      <Link key={product.slug} href={`/product/${product.slug}`} className="flex items-center justify-between gap-3 rounded-sm bg-zinc-50 p-3 hover:bg-orange-50">
                        <span className="line-clamp-1 text-sm font-black">{product.name}</span>
                        <span className="shrink-0 text-xs font-black text-[#f65f18]">MOQ {product.moq}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <aside className="grid gap-3">
              {trustItems.map((item) => (
                <div key={item.title} className="rounded-sm border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md">
                  <p className="text-sm font-black text-zinc-950">{item.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-zinc-500">{item.text}</p>
                </div>
              ))}
            </aside>
          </Container>
        </section>

        <section className="border-b border-orange-100 bg-white">
          <Container className="grid gap-4 py-5 md:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item.title} className="rounded-sm bg-zinc-50 px-4 py-4 ring-1 ring-zinc-200">
                <p className="text-sm font-black text-zinc-950">{item.title}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-zinc-500">{item.text}</p>
              </div>
            ))}
          </Container>
        </section>

        <section className="border-b border-orange-100 bg-white">
          <Container className="grid gap-4 py-5 md:grid-cols-4">
            {["Multiple categories in one supply hub", "Public prices before login", "No online payment required", "Manual confirmation for every order"].map((item) => (
              <div key={item} className="rounded-sm bg-orange-50 px-4 py-4 ring-1 ring-orange-100">
                <p className="text-sm font-black text-orange-800">{item}</p>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">Built for manual B2B wholesale ordering.</p>
                </div>
              ))}
          </Container>
        </section>

        <Container className="py-8">
          <SectionTitle eyebrow="Shop by category" title="Wholesale categories" />
          <CategoryGrid categories={categories} />
        </Container>

        <Container className="pb-8">
          <SectionTitle eyebrow="Best Sellers" title="Fast-moving wholesale items" action={<Link href="/category/all" className="text-sm font-black text-orange-700">View all</Link>} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {bestSellers.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
        </Container>

        <Container className="pb-8">
          <SectionTitle eyebrow="New Arrivals" title="Recently added supply" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {newArrivals.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
        </Container>

        <Container className="pb-8">
          <SectionTitle eyebrow="Ready Stock" title="Available for fast confirmation" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {(readyStock.length ? readyStock : products.slice(0, 6)).map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
        </Container>

        <Container className="pb-8">
          <SectionTitle eyebrow="For Order" title="Sourcing and manual confirmation" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {(forOrder.length ? forOrder : products.slice(0, 6)).map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
        </Container>

        <section className="border-y border-orange-100 bg-white">
          <Container className="py-9">
            <SectionTitle eyebrow="Wholesale Rules" title="Clear buying terms" />
            <div className="grid gap-4 md:grid-cols-4">
              {rules.map((rule, index) => (
                <div key={rule.title} className="rounded-sm bg-zinc-50 p-5 ring-1 ring-zinc-200">
                  <span className="grid h-9 w-9 place-items-center rounded-sm bg-[#f65f18] text-sm font-black text-white">{index + 1}</span>
                  <h3 className="mt-4 text-base font-black text-zinc-950">{rule.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{rule.text}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}

function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">{title}</h2>
      </div>
      {action}
    </div>
  );
}
