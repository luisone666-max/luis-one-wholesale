export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm text-zinc-600 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <p className="text-lg font-black text-zinc-950">WholesaleHub</p>
          <p className="mt-2 leading-6">A first-version B2B ordering mockup with public wholesale prices.</p>
        </div>
        <div>
          <p className="font-bold text-zinc-950">Buyer Rules</p>
          <p className="mt-2 leading-6">No online payment, no automatic shipping, and order placement will require login later.</p>
        </div>
        <div>
          <p className="font-bold text-zinc-950">Support</p>
          <p className="mt-2 leading-6">MOQ, carton quantity, stock checks, and price tiers are displayed before login.</p>
        </div>
        <div>
          <p className="font-bold text-zinc-950">Mockup Scope</p>
          <p className="mt-2 leading-6">Static frontend only. Mock product data only. No database connection.</p>
        </div>
      </div>
    </footer>
  );
}
