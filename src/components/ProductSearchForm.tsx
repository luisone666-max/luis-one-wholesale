"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

export function ProductSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const nextQuery = searchParams.get("q") ?? "";
    queueMicrotask(() => setQuery(nextQuery));
  }, [searchParams]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim().replace(/\s+/g, " ");

    if (!trimmed) {
      setMessage("Type a product name, model, or SKU first.");
      inputRef.current?.focus();
      return;
    }

    setMessage("");
    router.push(`/category/all?q=${encodeURIComponent(trimmed)}`);
  };

  const clearSearch = () => {
    setQuery("");
    setMessage("");
    router.push("/category/all");
  };

  return (
    <div>
      <form onSubmit={submit} className="flex overflow-hidden rounded-sm border-2 border-[#f65f18] bg-white shadow-sm">
        <div className="flex min-w-0 flex-1 items-center">
          <input
            ref={inputRef}
            aria-label="Search products"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (message) {
                setMessage("");
              }
            }}
            placeholder="Search part, model, SKU..."
            className="min-w-0 flex-1 px-2.5 py-2 text-[13px] font-semibold text-zinc-800 outline-none placeholder:text-zinc-400 sm:px-4 sm:py-3 sm:text-sm"
          />
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-sm text-sm font-black text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              X
            </button>
          ) : null}
        </div>
        <button type="submit" className="shrink-0 bg-[#f65f18] px-3 py-2 text-xs font-black text-white transition hover:bg-[#df4f0d] sm:px-5 sm:py-3 sm:text-sm">
          <span className="sm:hidden">Go</span>
          <span className="hidden sm:inline">Search</span>
        </button>
      </form>
      {message ? <p className="mt-1 text-xs font-black text-orange-700">{message}</p> : null}
    </div>
  );
}
