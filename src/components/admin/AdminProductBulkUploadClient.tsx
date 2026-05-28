"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminPageTitle, TableShell } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import type { BulkImportPreview, BulkImportMissingCategoryMode, BulkImportSummary, BulkProductCsvRow } from "@/lib/admin-product-bulk-upload";

type ApiResponse =
  | {
      ok: true;
      preview: BulkImportPreview;
      importSummary?: BulkImportSummary;
    }
  | {
      ok: false;
      message: string;
    };

const sampleTemplateRow = [
  "BULK-001",
  "Sample Wholesale Product",
  "Motorcycle Parts",
  "Honda Click",
  "Seat",
  "Sample Brand",
  "Universal",
  "1",
  "100",
  "180",
  "for_order",
  "3-7 days",
  "/products/flat-seat.svg",
  "Sample CSV product description.",
  "",
  "",
  "Admin-only supplier note",
  "Admin-only cost note",
  "500",
  "20",
  "15",
  "10",
  "true",
  "false",
  "false",
  "false",
  "standard",
  "Default parcel data for COD courier booking",
  "true",
];

const bulkUploadTemplateHeaders = [
  "SKU",
  "Product Name",
  "Category",
  "Subcategory",
  "Child Category",
  "Brand",
  "Model",
  "MOQ",
  "Cost Price",
  "Retail Price",
  "Stock Status",
  "Lead Time",
  "Image URL",
  "Description",
  "Price 1pc",
  "Price 6pcs",
  "Supplier Notes",
  "Internal Cost Notes",
  "Weight (g)",
  "Length (cm)",
  "Width (cm)",
  "Height (cm)",
  "COD Enabled",
  "Fragile",
  "Contains Battery",
  "Contains Liquid",
  "Shipping Category",
  "Shipping Notes",
  "Active",
];

const copy = {
  en: {
    caption: "Import or update products from CSV. Preview validation runs before anything is saved.",
    back: "Back to Products",
    downloadTitle: "1. Download CSV Template",
    downloadBody: "Use the required column names exactly. Product prices remain public, while supplier notes stay admin-only.",
    download: "Download CSV Template",
    uploadTitle: "2. Upload CSV File",
    uploadBody: "Upload a .csv file encoded as UTF-8. Excel upload can be added later.",
    chooseFile: "Choose CSV File",
    selectedFile: "Selected file",
    parsedRows: "Parsed rows",
    resetUpload: "Reset Upload",
    uploadReset: "Upload reset. Choose a CSV file to start again.",
    missingCategory: "Missing category handling",
    createInactive: "Create missing category as inactive",
    skipRows: "Skip rows with missing categories",
    previewTitle: "3. Preview Import",
    preview: "Preview Import",
    confirm: "Confirm Import",
    validationTitle: "4. Validation Results",
    summaryTitle: "6. Import Summary",
    noPreview: "Upload a CSV and click Preview Import.",
    row: "Row",
    productName: "Product Name",
    categoryPath: "Category Path",
    priceRange: "Price Range",
    active: "Active",
    status: "Status",
    messages: "Messages",
    action: "Action",
    stockStatus: "Stock Status",
    totalRows: "Total Rows",
    validRows: "Valid Rows",
    warningRows: "Warning Rows",
    errorRows: "Error Rows",
    skippedRows: "Skipped Rows",
    createdProducts: "Created Products",
    updatedProducts: "Updated Products",
    createdCategories: "Created Categories",
    errorCount: "Error Count",
    fileParsed: "CSV parsed. Preview is ready.",
    importDone: "Import finished.",
    importBlocked: "Fix error rows before importing.",
    warningNotice: "Warning rows can import after confirmation.",
    columnsTitle: "CSV Columns",
    ready: "Ready",
    warning: "Warning",
    error: "Error",
    skipped: "Skipped",
    create: "Create",
    update: "Update",
    skip: "Skip",
    noErrors: "No import errors.",
    checkImportedProducts: "Check Imported Products",
    importNextStep: "After import, open Product Management to confirm images, prices, categories, and customer visibility.",
    csvRulesTitle: "CSV Filling Rules",
    csvRuleStock: "Stock Status: ready_stock, for_order, low_stock, or unavailable.",
    csvRuleActive: "Active: true/false, yes/no, or 1/0.",
    csvRulePrices: "Cost Price auto-fills 1-5 pcs at +20% and 6+ pcs at +12%. Manual Price 1pc or Price 6pcs values override the auto prices.",
    csvRuleImages: "Image URL can be left blank first. You can upload images later in Product Management.",
    csvRuleLogistics: "COD logistics: fill Weight (g), Length/Width/Height (cm), COD Enabled, and Shipping Category for J&T readiness.",
    importGuardNoFile: "Choose a CSV file first.",
    importGuardPreview: "Click Preview Import before confirming.",
    importGuardErrors: "Fix error rows before confirming import.",
    importGuardReady: "Ready to import. Warning rows require confirmation.",
  },
  zh: {
    caption: "从 CSV 批量导入或更新商品。保存前会先预览校验结果。",
    back: "返回商品管理",
    downloadTitle: "1. 下载 CSV 模板",
    downloadBody: "请保持字段名称一致。商品价格公开显示，供应商备注仅后台可见。",
    download: "下载 CSV 模板",
    uploadTitle: "2. 上传 CSV 文件",
    uploadBody: "上传 UTF-8 编码的 .csv 文件。Excel 上传可以后面再加。",
    chooseFile: "选择 CSV 文件",
    selectedFile: "已选择文件",
    parsedRows: "已读取行数",
    resetUpload: "重置上传",
    uploadReset: "已重置上传。请重新选择 CSV 文件。",
    missingCategory: "缺失分类处理",
    createInactive: "创建缺失分类并设为未启用",
    skipRows: "跳过缺失分类的行",
    previewTitle: "3. 预览导入",
    preview: "预览导入",
    confirm: "确认导入",
    validationTitle: "4. 校验结果",
    summaryTitle: "6. 导入汇总",
    noPreview: "上传 CSV 后点击预览导入。",
    row: "行号",
    productName: "商品名称",
    categoryPath: "分类路径",
    priceRange: "价格范围",
    active: "启用",
    status: "状态",
    messages: "提示",
    action: "动作",
    stockStatus: "库存状态",
    totalRows: "总行数",
    validRows: "有效行",
    warningRows: "警告行",
    errorRows: "错误行",
    skippedRows: "跳过行",
    createdProducts: "新增商品",
    updatedProducts: "更新商品",
    createdCategories: "新增分类",
    errorCount: "错误数",
    fileParsed: "CSV 已解析，可以预览。",
    importDone: "导入完成。",
    importBlocked: "请先修复错误行再导入。",
    warningNotice: "警告行确认后可以导入。",
    columnsTitle: "CSV 字段",
    ready: "可导入",
    warning: "警告",
    error: "错误",
    skipped: "已跳过",
    create: "新增",
    update: "更新",
    skip: "跳过",
    noErrors: "没有导入错误。",
    checkImportedProducts: "检查已导入商品",
    importNextStep: "导入后请打开商品管理，检查图片、价格、分类和前台显示状态。",
    csvRulesTitle: "CSV 填写规则",
    csvRuleStock: "库存状态：ready_stock、for_order、low_stock、unavailable。",
    csvRuleActive: "启用状态：true/false、yes/no、1/0 都可以。",
    csvRulePrices: "价格字段会生成批发阶梯：1pc、6pcs、12pcs、50pcs。",
    csvRuleImages: "图片链接可以先留空，之后在商品管理里再上传图片。",
    csvRuleLogistics: "COD 物流：填写 Weight (g)、Length/Width/Height (cm)、COD Enabled、Shipping Category，方便后续 J&T 出单。",
    importGuardNoFile: "请先选择 CSV 文件。",
    importGuardPreview: "请先点击预览导入，再确认导入。",
    importGuardErrors: "请先修复错误行，再确认导入。",
    importGuardReady: "可以导入。警告行会在确认后继续导入。",
  },
};

function escapeCsvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }

  return value;
}

function buildTemplateCsv() {
  return [bulkUploadTemplateHeaders, sampleTemplateRow].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === "\"") {
      if (inQuotes && next === "\"") {
        cell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.trim())) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  row.push(cell);
  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  return rows;
}

function csvToRows(text: string): BulkProductCsvRow[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  const headers = rows[0]?.map((header) => header.trim()) ?? [];

  return rows.slice(1).map((row, rowIndex) => ({
    rowNumber: rowIndex + 2,
    data: Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim() ?? ""])),
  }));
}

function downloadTemplate() {
  const blob = new Blob([buildTemplateCsv()], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "wholesale-product-upload-template.csv";
  link.click();
  window.URL.revokeObjectURL(url);
}

function statusClass(status: string) {
  if (status === "ready") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (status === "warning") {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }

  if (status === "skipped") {
    return "bg-zinc-100 text-zinc-700 ring-zinc-200";
  }

  return "bg-red-50 text-red-700 ring-red-100";
}

export function AdminProductBulkUploadClient() {
  const { language } = useAdminI18n();
  const t = copy[language];
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<BulkProductCsvRow[]>([]);
  const [missingCategoryMode, setMissingCategoryMode] = useState<BulkImportMissingCategoryMode>("create_inactive");
  const [preview, setPreview] = useState<BulkImportPreview | null>(null);
  const [importSummary, setImportSummary] = useState<BulkImportSummary | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const hasErrors = Boolean(preview?.rows.some((row) => row.status === "error"));
  const hasWarnings = Boolean(preview?.rows.some((row) => row.status === "warning"));
  const canImport = Boolean(preview && !hasErrors && preview.summary.totalRows > 0);
  const importGuardMessage = !rows.length
    ? t.importGuardNoFile
    : !preview
      ? t.importGuardPreview
      : hasErrors
        ? t.importGuardErrors
        : t.importGuardReady;

  const readFile = async (file: File) => {
    const text = await file.text();
    const parsedRows = csvToRows(text);
    setFileName(file.name);
    setRows(parsedRows);
    setPreview(null);
    setImportSummary(null);
    setMessage(t.fileParsed);
  };

  const resetUpload = () => {
    setFileInputKey((current) => current + 1);
    setFileName("");
    setRows([]);
    setPreview(null);
    setImportSummary(null);
    setMessage(t.uploadReset);
  };

  const callApi = async (mode: "preview" | "import") => {
    setBusy(true);
    setMessage("");
    const bulkUploadFailed = language === "zh" ? "批量上传失败。" : "Bulk upload failed.";

    try {
      const response = await fetch("/api/admin/products/bulk-upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, rows, missingCategoryMode }),
      });
      const result = (await response.json().catch(() => ({ ok: false, message: bulkUploadFailed }))) as ApiResponse;

      if (!response.ok) {
        setMessage(result.ok ? bulkUploadFailed : result.message);
        return;
      }

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setPreview(result.preview);
      setImportSummary(result.importSummary ?? null);
      setMessage(mode === "import" ? t.importDone : t.fileParsed);
    } catch {
      setMessage(bulkUploadFailed);
    } finally {
      setBusy(false);
    }
  };

  const importRows = async () => {
    if (!canImport) {
      setMessage(t.importBlocked);
      return;
    }

    if (hasWarnings && !window.confirm(t.warningNotice)) {
      return;
    }

    await callApi("import");
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <AdminPageTitle titleKey="bulkUpload" caption={t.caption} />
        <Link href="/admin/products" className="h-10 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700">
          {t.back}
        </Link>
      </div>

      {message ? <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-700">{message}</div> : null}

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-zinc-950">{t.downloadTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{t.downloadBody}</p>
            <button type="button" onClick={downloadTemplate} className="mt-4 h-11 rounded-md bg-[#f65f18] px-4 text-sm font-black text-white">
              {t.download}
            </button>
          </section>

          <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-zinc-950">{t.uploadTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{t.uploadBody}</p>
            <label className="mt-4 grid cursor-pointer place-items-center rounded-md border border-dashed border-orange-300 bg-orange-50 px-4 py-8 text-center text-sm font-black text-orange-700">
              {t.chooseFile}
              <input
                key={fileInputKey}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void readFile(file);
                  }
                }}
              />
            </label>
            {fileName ? (
              <div className="mt-3 rounded-md border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-sm font-bold text-zinc-700">
                  {t.selectedFile}: {fileName}
                </p>
                <p className="mt-1 text-xs font-black text-zinc-500">
                  {t.parsedRows}: {rows.length}
                </p>
                <button
                  type="button"
                  onClick={resetUpload}
                  className="mt-3 h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs font-black text-zinc-700 hover:border-orange-200 hover:text-orange-700"
                >
                  {t.resetUpload}
                </button>
              </div>
            ) : null}
          </section>

          <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-zinc-950">{t.missingCategory}</h2>
            <div className="mt-4 space-y-3 text-sm font-bold text-zinc-700">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="missing-category-mode"
                  value="create_inactive"
                  checked={missingCategoryMode === "create_inactive"}
                  onChange={() => setMissingCategoryMode("create_inactive")}
                  className="h-4 w-4 accent-[#f65f18]"
                />
                {t.createInactive}
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="missing-category-mode"
                  value="skip"
                  checked={missingCategoryMode === "skip"}
                  onChange={() => setMissingCategoryMode("skip")}
                  className="h-4 w-4 accent-[#f65f18]"
                />
                {t.skipRows}
              </label>
            </div>
          </section>

          <section className="rounded-md border border-orange-100 bg-orange-50 p-5 shadow-sm">
            <h2 className="text-lg font-black text-zinc-950">{t.csvRulesTitle}</h2>
            <ul className="mt-3 space-y-2 text-sm font-bold leading-6 text-orange-800">
              <li>{t.csvRuleStock}</li>
              <li>{t.csvRuleActive}</li>
              <li>{t.csvRulePrices}</li>
              <li>{t.csvRuleImages}</li>
              <li>{t.csvRuleLogistics}</li>
            </ul>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-zinc-950">{t.previewTitle}</h2>
                <div className="mt-2">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.columnsTitle}</p>
                  <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pr-1">
                    {bulkUploadTemplateHeaders.map((header) => (
                      <span key={header} className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-black text-zinc-600">
                        {header}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!rows.length || busy}
                  onClick={() => void callApi("preview")}
                  className="h-11 rounded-md border border-orange-200 bg-orange-50 px-4 text-sm font-black text-orange-700 disabled:opacity-40"
                >
                  {t.preview}
                </button>
                <button
                  type="button"
                  disabled={!canImport || busy}
                  onClick={() => void importRows()}
                  className="h-11 rounded-md bg-[#f65f18] px-4 text-sm font-black text-white disabled:opacity-40"
                >
                  {t.confirm}
                </button>
              </div>
            </div>
            <p className={`mt-3 rounded-md px-3 py-2 text-xs font-black ${canImport ? "bg-emerald-50 text-emerald-700" : "bg-zinc-50 text-zinc-600"}`}>
              {importGuardMessage}
            </p>
          </section>

          <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-zinc-950">{t.validationTitle}</h2>
            {preview ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Metric label={t.totalRows} value={preview.summary.totalRows} />
                <Metric label={t.validRows} value={preview.summary.validRows} />
                <Metric label={t.warningRows} value={preview.summary.warningRows} />
                <Metric label={t.errorRows} value={preview.summary.errorRows} />
                <Metric label={t.skippedRows} value={preview.summary.skippedRows} />
              </div>
            ) : (
              <p className="mt-3 text-sm font-bold text-zinc-500">{t.noPreview}</p>
            )}
          </section>

          <TableShell>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1240px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">{t.row}</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">{t.productName}</th>
                    <th className="px-4 py-3">{t.categoryPath}</th>
                    <th className="px-4 py-3">MOQ</th>
                    <th className="px-4 py-3">{t.stockStatus}</th>
                    <th className="px-4 py-3">{t.priceRange}</th>
                    <th className="px-4 py-3">Logistics</th>
                    <th className="px-4 py-3">{t.active}</th>
                    <th className="px-4 py-3">{t.action}</th>
                    <th className="px-4 py-3">{t.status}</th>
                    <th className="px-4 py-3">{t.messages}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {(preview?.rows ?? []).map((row) => (
                    <tr key={`${row.rowNumber}-${row.sku}`} className="bg-white">
                      <td className="px-4 py-3 font-black text-zinc-950">{row.rowNumber}</td>
                      <td className="px-4 py-3 font-black text-zinc-800">{row.sku}</td>
                      <td className="px-4 py-3 font-bold text-zinc-700">{row.productName}</td>
                      <td className="px-4 py-3 text-zinc-600">{row.categoryPath}</td>
                      <td className="px-4 py-3 text-zinc-600">{row.moq ?? "-"}</td>
                      <td className="px-4 py-3 text-zinc-600">{row.stockStatus}</td>
                      <td className="px-4 py-3 font-black text-orange-700">{row.priceRange}</td>
                      <td className="px-4 py-3 text-xs font-bold text-zinc-600">{row.logisticsSummary}</td>
                      <td className="px-4 py-3 text-zinc-600">{row.active === null ? "-" : String(row.active)}</td>
                      <td className="px-4 py-3 text-zinc-600">{t[row.action]}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-1 text-xs font-black ring-1 ${statusClass(row.status)}`}>{t[row.status]}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{row.messages.length ? row.messages.join(" ") : "-"}</td>
                    </tr>
                  ))}
                  {!preview?.rows.length ? (
                    <tr>
                      <td className="px-4 py-6 text-zinc-500" colSpan={12}>{t.noPreview}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </TableShell>

          <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-zinc-950">{t.summaryTitle}</h2>
            {importSummary ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <Metric label={t.createdProducts} value={importSummary.createdProducts} />
                  <Metric label={t.updatedProducts} value={importSummary.updatedProducts} />
                  <Metric label={t.skippedRows} value={importSummary.skippedRows} />
                  <Metric label={t.createdCategories} value={importSummary.createdCategories} />
                  <Metric label={t.errorCount} value={importSummary.errorCount} />
                </div>
                <div className="mt-4 rounded-md bg-zinc-50 p-4 text-sm font-bold text-zinc-600">
                  {importSummary.errors.length ? importSummary.errors.join(" ") : t.noErrors}
                </div>
                <div className="mt-4 rounded-md border border-orange-100 bg-orange-50 p-4">
                  <p className="text-sm font-bold leading-6 text-orange-800">{t.importNextStep}</p>
                  <Link
                    href="/admin/products"
                    className="mt-3 inline-flex h-10 items-center rounded-md bg-[#f65f18] px-4 text-sm font-black text-white"
                  >
                    {t.checkImportedProducts}
                  </Link>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm font-bold text-zinc-500">{t.noPreview}</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-100 bg-zinc-50 p-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-zinc-950">{value}</p>
    </div>
  );
}
