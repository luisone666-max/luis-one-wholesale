export default function Loading() {
  return (
    <main className="bg-zinc-50">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-36 rounded bg-orange-100" />
          <div className="mt-4 h-9 max-w-xl rounded bg-zinc-100" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-56 rounded-md bg-zinc-100" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

