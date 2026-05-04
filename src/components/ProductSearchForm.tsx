"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export function ProductSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/category/all?q=${encodeURIComponent(trimmed)}` : "/");
  };

  return (
    <form onSubmit={submit} className="flex overflow-hidden rounded-sm border-2 border-[#f65f18] bg-white shadow-sm">
      <input
        aria-label="Search products"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search product, SKU, model, Click, NMAX..."
        className="min-w-0 flex-1 px-3 py-2 text-sm font-semibold text-zinc-800 outline-none sm:px-4 sm:py-3"
      />
      <button type="submit" className="bg-[#f65f18] px-4 py-2 text-sm font-black text-white transition hover:bg-[#df4f0d] sm:px-5 sm:py-3">
        Search
      </button>
    </form>
  );
}
