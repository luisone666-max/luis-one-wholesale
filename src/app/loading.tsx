export default function Loading() {
  return (
    <div className="min-h-[50vh] bg-[#f6f6f6] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-orange-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[#f65f18]" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-sm border border-zinc-200 bg-white shadow-sm">
              <div className="aspect-square animate-pulse bg-orange-50" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-100" />
                <div className="h-4 w-2/5 animate-pulse rounded bg-orange-100" />
                <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
