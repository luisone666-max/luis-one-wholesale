"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPageTitle, AdminToggle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { formatImageBytes, prepareAdminUploadImage } from "@/lib/admin-image-compression";
import type { AdminCategoryRecord } from "@/lib/admin-categories-data";

type CategoryDraft = {
  id?: string;
  nameEn: string;
  nameZh: string;
  slug: string;
  parentId: string;
  iconUrl: string;
  imageUrl: string;
  active: boolean;
  showOnHomepage: boolean;
  showInNavigation: boolean;
  sortOrder: number;
  templateType: string;
  description: string;
};

type FlatCategory = AdminCategoryRecord & {
  depth: number;
  pathEn: string;
  pathZh: string;
};

const text = {
  en: {
    slug: "Slug",
    level: "Level",
    imageUrl: "Image URL",
    uploadImage: "Upload Image",
    uploadingImage: "Uploading...",
    clearImage: "Clear image",
    noCategoryImage: "No category image",
    imageHelp: "JPG, PNG, or WebP. Max 2MB.",
    templateType: "Template Type",
    applyTemplate: "Apply Category Template",
    selectTemplate: "Select template",
    created: "Category saved.",
    deleted: "Category deleted.",
    moved: "Category moved.",
    templateApplied: "Template applied.",
    confirmDelete: "Delete this category?",
    confirmTemplate: "Create missing categories from this template? New categories are inactive by default.",
    productCountHint: "Direct / total products under this category path",
  },
  zh: {
    slug: "Slug",
    level: "层级",
    imageUrl: "图片 URL",
    templateType: "模板类型",
    applyTemplate: "应用分类模板",
    selectTemplate: "选择模板",
    created: "分类已保存。",
    deleted: "分类已删除。",
    moved: "分类已移动。",
    templateApplied: "模板已应用。",
    confirmDelete: "确定删除这个分类？",
    confirmTemplate: "从模板创建缺失分类？新模板分类默认不启用。",
    productCountHint: "直接商品数 / 分类路径总商品数",
  },
};

const templateOptions = [
  { value: "motorcycle_parts", label: "Motorcycle Parts" },
  { value: "daily_essentials", label: "Daily Essentials" },
  { value: "electronics", label: "Electronics" },
  { value: "food_spices", label: "Food & Spices" },
];

function emptyDraft(parentId = ""): CategoryDraft {
  return {
    nameEn: "",
    nameZh: "",
    slug: "",
    parentId,
    iconUrl: "",
    imageUrl: "",
    active: false,
    showOnHomepage: false,
    showInNavigation: false,
    sortOrder: 0,
    templateType: "",
    description: "",
  };
}

function categoryToDraft(category: AdminCategoryRecord): CategoryDraft {
  return {
    id: category.id,
    nameEn: category.nameEn,
    nameZh: category.nameZh,
    slug: category.slug,
    parentId: category.parentId ?? "",
    iconUrl: category.iconUrl,
    imageUrl: category.imageUrl,
    active: category.active,
    showOnHomepage: category.showOnHomepage,
    showInNavigation: category.showInNavigation,
    sortOrder: category.sortOrder,
    templateType: category.templateType,
    description: category.description,
  };
}

function flatten(categories: AdminCategoryRecord[], parentId: string | null = null, depth = 0, pathEn = "", pathZh = ""): FlatCategory[] {
  return categories
    .filter((category) => category.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.nameEn.localeCompare(b.nameEn))
    .flatMap((category) => {
      const nextPathEn = pathEn ? `${pathEn} > ${category.nameEn}` : category.nameEn;
      const nextPathZh = pathZh ? `${pathZh} > ${category.nameZh || category.nameEn}` : category.nameZh || category.nameEn;

      return [
        { ...category, depth, pathEn: nextPathEn, pathZh: nextPathZh },
        ...flatten(categories, category.id, depth + 1, nextPathEn, nextPathZh),
      ];
    });
}

function isDescendant(flat: FlatCategory[], sourceId: string, targetId: string) {
  const source = flat.find((item) => item.id === sourceId);
  const target = flat.find((item) => item.id === targetId);
  return Boolean(source && target && target.pathEn.startsWith(`${source.pathEn} >`));
}

function subtreeDepth(categories: AdminCategoryRecord[], categoryId: string): number {
  const children = categories.filter((category) => category.parentId === categoryId);

  if (!children.length) {
    return 1;
  }

  return 1 + Math.max(...children.map((child) => subtreeDepth(categories, child.id)));
}

export function AdminCategoriesClient({
  initialCategories,
  initialError,
}: {
  initialCategories: AdminCategoryRecord[];
  initialError?: string;
}) {
  const { t, language } = useAdminI18n();
  const copy = text[language];
  const imageCopy = language === "zh"
    ? {
        uploadImage: "上传图片",
        uploadingImage: "上传中...",
        clearImage: "清除图片",
        noCategoryImage: "暂无分类图片",
        imageHelp: "支持 JPG、PNG、WebP，最大 2MB。",
      }
    : {
        uploadImage: "Upload Image",
        uploadingImage: "Uploading...",
        clearImage: "Clear image",
        noCategoryImage: "No category image",
        imageHelp: "JPG, PNG, or WebP. Max 2MB.",
      };
  const [categories, setCategories] = useState(initialCategories);
  const [draft, setDraft] = useState<CategoryDraft>(emptyDraft());
  const [message, setMessage] = useState(initialError ?? "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [template, setTemplate] = useState("motorcycle_parts");
  const flat = useMemo(() => flatten(categories), [categories]);
  const parentOptions = flat.filter((category) => category.depth < 2 && category.id !== draft.id && !isDescendant(flat, draft.id ?? "", category.id));
  const displayPath = (category: FlatCategory) => (language === "zh" ? category.pathZh : category.pathEn);

  const reload = () => window.location.reload();

  const saveCategory = async () => {
    const endpoint = draft.id ? `/api/admin/categories/${draft.id}` : "/api/admin/categories";
    const response = await fetch(endpoint, {
      method: draft.id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    const result = (await response.json().catch(() => ({ ok: false, message: "Save failed." }))) as { ok?: boolean; message?: string };

    if (!response.ok || !result.ok) {
      setMessage(result.message ?? "Save failed.");
      return;
    }

    setMessage(copy.created);
    reload();
  };

  const toggleCategory = async (category: AdminCategoryRecord, patch: Partial<Pick<AdminCategoryRecord, "active" | "showOnHomepage" | "showInNavigation">>) => {
    const response = await fetch(`/api/admin/categories/${category.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "toggle", ...patch }),
    });
    const result = (await response.json().catch(() => ({ ok: false, message: "Update failed." }))) as { ok?: boolean; message?: string };

    if (!response.ok || !result.ok) {
      setMessage(result.message ?? "Update failed.");
      return;
    }

    setCategories((current) => current.map((item) => (item.id === category.id ? { ...item, ...patch } : item)));
  };

  const reorderCategory = async (category: AdminCategoryRecord, direction: -1 | 1) => {
    const nextSortOrder = Math.max(0, category.sortOrder + direction);
    const response = await fetch(`/api/admin/categories/${category.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "reorder", sortOrder: nextSortOrder }),
    });
    const result = (await response.json().catch(() => ({ ok: false, message: "Reorder failed." }))) as { ok?: boolean; message?: string };

    if (!response.ok || !result.ok) {
      setMessage(result.message ?? "Reorder failed.");
      return;
    }

    setCategories((current) => current.map((item) => (item.id === category.id ? { ...item, sortOrder: nextSortOrder } : item)));
  };

  const deleteCategory = async (category: AdminCategoryRecord) => {
    if (!window.confirm(copy.confirmDelete)) {
      return;
    }

    const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    const result = (await response.json().catch(() => ({ ok: false, message: "Delete failed." }))) as { ok?: boolean; message?: string };

    if (!response.ok || !result.ok) {
      setMessage(result.message ?? "Delete failed.");
      return;
    }

    setCategories((current) => current.filter((item) => item.id !== category.id));
    setMessage(copy.deleted);
  };

  const applyTemplate = async () => {
    if (!window.confirm(copy.confirmTemplate)) {
      return;
    }

    const response = await fetch("/api/admin/categories/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ template }),
    });
    const result = (await response.json().catch(() => ({ ok: false, message: "Template failed." }))) as { ok?: boolean; message?: string };

    if (!response.ok || !result.ok) {
      setMessage(result.message ?? "Template failed.");
      return;
    }

    setMessage(copy.templateApplied);
    reload();
  };

  const uploadCategoryImage = async (file?: File) => {
    if (!file) {
      return;
    }

    setMessage("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Only JPG, PNG, and WebP image files are allowed.");
      return;
    }

    let uploadFile = file;

    try {
      setMessage("Optimizing image...");
      const prepared = await prepareAdminUploadImage(file);
      uploadFile = prepared.file;
      if (prepared.compressed) {
        setMessage(`Image optimized from ${formatImageBytes(prepared.originalBytes)} to ${formatImageBytes(prepared.file.size)}.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image file must be 2MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("slug", draft.slug);
    formData.append("name", draft.nameEn);

    setUploadingImage(true);

    try {
      const response = await fetch("/api/admin/categories/image-upload", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => ({ ok: false, message: "Upload failed." }))) as {
        ok?: boolean;
        imageUrl?: string;
        message?: string;
      };

      if (!response.ok || !result.ok || !result.imageUrl) {
        setMessage(result.message ?? "Upload failed.");
        return;
      }

      setDraft((current) => ({ ...current, imageUrl: result.imageUrl ?? "" }));
      setMessage(language === "zh" ? "图片已上传，请保存分类。" : "Image uploaded. Save the category to keep it.");
    } finally {
      setUploadingImage(false);
    }
  };

  const canUseParent = (category: FlatCategory) => {
    if (!draft.id) {
      return category.depth < 2;
    }

    return category.depth + subtreeDepth(categories, draft.id) <= 2;
  };

  return (
    <>
      <AdminPageTitle titleKey="categories" caption={t("categoryTreeHint")} />
      {message ? <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-700">{message}</div> : null}

      <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_430px]">
        <div className="rounded-md border border-orange-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setDraft(emptyDraft())} className="rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white">
              {t("addMainCategory")}
            </button>
            <StatusPill tone="orange">{t("disabledHidden")}</StatusPill>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{t("categoryRules")}</p>
          <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-black text-zinc-950">{copy.applyTemplate}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <select value={template} onChange={(event) => setTemplate(event.target.value)} className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold">
                {templateOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button type="button" onClick={applyTemplate} className="h-10 rounded-md border border-orange-200 bg-orange-50 px-4 text-sm font-black text-orange-700">
                {copy.applyTemplate}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black text-zinc-950">{draft.id ? t("edit") : t("createCategory")}</p>
          <div className="mt-4 grid gap-3">
            <Input value={draft.nameEn} onChange={(value) => setDraft({ ...draft, nameEn: value })} placeholder={t("categoryNameEn")} />
            <Input value={draft.nameZh} onChange={(value) => setDraft({ ...draft, nameZh: value })} placeholder={t("categoryNameZh")} />
            <Input value={draft.slug} onChange={(value) => setDraft({ ...draft, slug: value })} placeholder={copy.slug} />
            <select value={draft.parentId} onChange={(event) => setDraft({ ...draft, parentId: event.target.value })} className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-orange-500">
              <option value="">{t("noParent")}</option>
              {parentOptions.filter(canUseParent).map((category) => (
                <option key={category.id} value={category.id}>{displayPath(category)}</option>
              ))}
            </select>
            <Input value={draft.iconUrl} onChange={(value) => setDraft({ ...draft, iconUrl: value })} placeholder={t("iconImageUrl")} />
            <Input value={draft.imageUrl} onChange={(value) => setDraft({ ...draft, imageUrl: value })} placeholder={copy.imageUrl} />
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{copy.imageUrl}</p>
                  <p className="mt-1 text-xs font-bold text-zinc-400">{imageCopy.imageHelp}</p>
                </div>
                <label className="cursor-pointer rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-black text-orange-700">
                  {uploadingImage ? imageCopy.uploadingImage : imageCopy.uploadImage}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={(event) => {
                      void uploadCategoryImage(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
                <button type="button" onClick={() => setDraft({ ...draft, imageUrl: "" })} className="text-xs font-black text-orange-700">
                  {language === "zh" ? "清除图片" : "Clear image"}
                </button>
              </div>
              <div className="mt-3 aspect-[4/3] overflow-hidden rounded-md bg-white p-3 ring-1 ring-zinc-100">
                {draft.imageUrl ? (
                  <Image src={draft.imageUrl} alt={draft.nameEn || "Category image preview"} width={360} height={270} className="h-full w-full object-contain" unoptimized />
                ) : (
                  <div className="grid h-full place-items-center text-xs font-bold text-zinc-400">{language === "zh" ? "暂无分类图片" : "No category image"}</div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input value={String(draft.sortOrder)} onChange={(value) => setDraft({ ...draft, sortOrder: Math.max(0, Number(value) || 0) })} placeholder={t("sortOrder")} type="number" />
              <Input value={draft.templateType} onChange={(value) => setDraft({ ...draft, templateType: value })} placeholder={copy.templateType} />
            </div>
            <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder={t("description")} className="min-h-20 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
            <div className="grid grid-cols-3 gap-2 text-xs font-bold text-zinc-700">
              {([
                ["active", t("activeToggle")],
                ["showOnHomepage", t("showHomepage")],
                ["showInNavigation", t("showNavigation")],
              ] as const).map(([key, label]) => (
                <button key={key} type="button" onClick={() => setDraft({ ...draft, [key]: !draft[key] })} className={`rounded-md border px-2 py-2 ${draft[key] ? "border-orange-200 bg-orange-50 text-orange-700" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>
                  {label}
                </button>
              ))}
            </div>
            <button type="button" onClick={saveCategory} className="h-10 rounded-md bg-zinc-950 text-sm font-black text-white">{t("save")}</button>
          </div>
        </div>
      </div>

      <TableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1460px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t("activeToggle")}</th>
                <th className="px-4 py-3">{t("showHomepage")}</th>
                <th className="px-4 py-3">{t("showNavigation")}</th>
                <th className="px-4 py-3">{t("categoryNameEn")}</th>
                <th className="px-4 py-3">{t("categoryNameZh")}</th>
                <th className="px-4 py-3">{copy.level}</th>
                <th className="px-4 py-3">{t("productCount")}</th>
                <th className="px-4 py-3">{t("sortOrder")}</th>
                <th className="px-4 py-3">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {flat.map((category) => (
                <tr key={category.id} className={category.active ? "bg-white" : "bg-zinc-50"}>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleCategory(category, { active: !category.active })}>
                      <AdminToggle checked={category.active} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleCategory(category, { showOnHomepage: !category.showOnHomepage })}>
                      <AdminToggle checked={category.showOnHomepage} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleCategory(category, { showInNavigation: !category.showInNavigation })}>
                      <AdminToggle checked={category.showInNavigation} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3" style={{ paddingLeft: category.depth * 24 }}>
                      <span className={`h-2 w-2 rounded-full ${category.active ? "bg-[#f65f18]" : "bg-zinc-300"}`} />
                      <div>
                        <p className="font-black text-zinc-950">{category.nameEn}</p>
                        <p className="text-xs font-bold text-zinc-400">{category.pathEn}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-zinc-700">{category.nameZh}</td>
                  <td className="px-4 py-3 font-bold text-zinc-600">{category.level}</td>
                  <td className="px-4 py-3">
                    <span className="font-black text-zinc-700">{category.directProductCount}</span>
                    <span className="ml-1 text-xs font-bold text-zinc-400">/ {category.totalProductCount}</span>
                    <p className="text-[11px] font-bold text-zinc-400">{copy.productCountHint}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-700">{category.sortOrder}</span>
                      <button type="button" onClick={() => reorderCategory(category, -1)} className="rounded border border-zinc-200 px-2 py-1 font-black">Up</button>
                      <button type="button" onClick={() => reorderCategory(category, 1)} className="rounded border border-zinc-200 px-2 py-1 font-black">Down</button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setDraft(emptyDraft(category.id))} disabled={category.level >= 3} className="rounded-md border border-orange-200 px-3 py-2 text-xs font-black text-orange-700 disabled:border-zinc-200 disabled:text-zinc-400">{t("addChild")}</button>
                      <button type="button" onClick={() => setDraft(categoryToDraft(category))} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">{t("edit")}</button>
                      <button type="button" onClick={() => toggleCategory(category, { active: !category.active })} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">{category.active ? t("disable") : t("enable")}</button>
                      <button type="button" onClick={() => setDraft(categoryToDraft(category))} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">{t("move")}</button>
                      <button type="button" onClick={() => deleteCategory(category)} className="rounded-md border border-red-200 px-3 py-2 text-xs font-black text-red-700">{t("delete")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>
    </>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-orange-500"
    />
  );
}
