"use client";

import { useEffect, useRef } from "react";
import { trackMetaEvent } from "@/components/MetaPixel";

export function SearchEventTracker({
  query,
  resultCount,
  categorySlug,
}: {
  query: string;
  resultCount: number;
  categorySlug: string;
}) {
  const trackedKey = useRef("");
  const normalizedQuery = query.trim();

  useEffect(() => {
    if (!normalizedQuery) {
      return;
    }

    const key = `${categorySlug}:${normalizedQuery}:${resultCount}`;

    if (trackedKey.current === key) {
      return;
    }

    trackedKey.current = key;
    trackMetaEvent("Search", {
      search_string: normalizedQuery,
      content_category: categorySlug,
      results_count: resultCount,
    });
  }, [categorySlug, normalizedQuery, resultCount]);

  return null;
}
