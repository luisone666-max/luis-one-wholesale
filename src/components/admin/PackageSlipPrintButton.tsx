"use client";

export function PackageSlipPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white print:hidden"
    >
      Print
    </button>
  );
}
