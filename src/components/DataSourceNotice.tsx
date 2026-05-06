export function DataSourceNotice({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto max-w-7xl px-4 py-3 text-sm font-bold text-amber-800 sm:px-6 lg:px-8">
        {message}
      </div>
    </div>
  );
}
