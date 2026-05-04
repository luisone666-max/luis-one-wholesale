"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getMetaPixelId } from "@/lib/meta-pixel";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

const metaPixelId = getMetaPixelId();

export function trackMetaEvent(eventName: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq || !metaPixelId) {
    return;
  }

  window.fbq("track", eventName, data ?? {});
}

export function MetaPixel() {
  const pathname = usePathname();
  const isFirstPageView = useRef(true);

  useEffect(() => {
    if (!metaPixelId || !window.fbq) {
      return;
    }

    if (isFirstPageView.current) {
      isFirstPageView.current = false;
      return;
    }

    window.fbq("track", "PageView");
  }, [pathname]);

  return null;
}
