"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type DragState = {
  pointerId: number;
  startX: number;
  scrollLeft: number;
  moved: boolean;
};

export function HorizontalScrollRail({
  children,
  className = "",
  viewportClassName = "",
}: {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [scrollState, setScrollState] = useState({ left: false, right: false });

  const isInteractiveTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement && Boolean(target.closest("a,button,input,select,textarea"));

  const updateScrollState = useCallback(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const next = {
      left: viewport.scrollLeft > 1,
      right: viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1,
    };

    setScrollState((current) => (current.left === next.left && current.right === next.right ? current : next));
  }, []);

  useEffect(() => {
    updateScrollState();

    const viewport = viewportRef.current;
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateScrollState);

    if (viewport && resizeObserver) {
      resizeObserver.observe(viewport);
    }

    window.addEventListener("resize", updateScrollState);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [children, updateScrollState]);

  const scrollByPage = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const distance = Math.max(260, viewport.clientWidth * 0.85);
    const nextLeft = Math.max(0, Math.min(viewport.scrollWidth - viewport.clientWidth, viewport.scrollLeft + direction * distance));

    viewport.scrollTo({
      left: nextLeft,
      behavior: "smooth",
    });
    updateScrollState();
    window.setTimeout(updateScrollState, 250);
  };

  const finishDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <div className={`flex min-w-0 items-center gap-1 ${className}`}>
      <button
        type="button"
        aria-label={scrollState.left ? "Scroll categories left" : "Already at start"}
        title={scrollState.left ? "Scroll left" : "Already at start"}
        disabled={!scrollState.left}
        onClick={() => scrollByPage(-1)}
        className="grid h-7 w-7 place-items-center rounded-sm border border-zinc-200 bg-white text-sm font-black text-zinc-600 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 active:scale-95 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:bg-zinc-50 disabled:text-zinc-300 disabled:opacity-35 disabled:shadow-none disabled:active:scale-100 sm:h-8 sm:w-8"
      >
        {"<"}
      </button>
      <div
        ref={viewportRef}
        onPointerDown={(event) => {
          if (event.button !== 0 || !viewportRef.current || isInteractiveTarget(event.target)) {
            return;
          }

          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            scrollLeft: viewportRef.current.scrollLeft,
            moved: false,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          const viewport = viewportRef.current;
          if (!drag || !viewport || drag.pointerId !== event.pointerId) {
            return;
          }

          const delta = event.clientX - drag.startX;
          if (Math.abs(delta) > 5) {
            drag.moved = true;
            suppressClickRef.current = true;
          }
          viewport.scrollLeft = drag.scrollLeft - delta;
        }}
        onPointerUp={(event) => {
          if (dragRef.current?.pointerId === event.pointerId) {
            finishDrag();
            window.setTimeout(() => {
              suppressClickRef.current = false;
            }, 0);
          }
        }}
        onPointerCancel={finishDrag}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          suppressClickRef.current = false;
        }}
        onScroll={updateScrollState}
        className={`flex min-w-0 flex-1 snap-x overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&>a]:cursor-pointer [&::-webkit-scrollbar]:hidden ${dragging ? "cursor-grabbing select-none" : ""} ${viewportClassName}`}
      >
        {children}
      </div>
      <button
        type="button"
        aria-label={scrollState.right ? "Scroll categories right" : "Already at end"}
        title={scrollState.right ? "Scroll right" : "Already at end"}
        disabled={!scrollState.right}
        onClick={() => scrollByPage(1)}
        className="grid h-7 w-7 place-items-center rounded-sm border border-zinc-200 bg-white text-sm font-black text-zinc-600 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 active:scale-95 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:bg-zinc-50 disabled:text-zinc-300 disabled:opacity-35 disabled:shadow-none disabled:active:scale-100 sm:h-8 sm:w-8"
      >
        {">"}
      </button>
    </div>
  );
}
