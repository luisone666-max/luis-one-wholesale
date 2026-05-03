"use client";

import { useMemo, useState } from "react";
import { AdminShell, useAdminI18n } from "@/components/admin/AdminShell";
import { AdminPageTitle, AdminToggle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { adminCategories, AdminCategoryNode } from "@/lib/admin-mock-data";

type FlatCategory = {
  node: AdminCategoryNode;
  depth: number;
  parentId: string;
  pathEn: string;
  pathZh: string;
};

type CategoryForm = {
  id?: string;
  nameEn: string;
  nameZh: string;
  parentId: string;
  iconUrl: string;
  description: string;
  productCount: number;
  sortOrder: number;
  active: boolean;
  homepage: boolean;
  navigation: boolean;
};

const storageKey = "admin-category-tree-v2";
const emptyForm: CategoryForm = {
  nameEn: "",
  nameZh: "",
  parentId: "",
  iconUrl: "",
  description: "",
  productCount: 0,
  sortOrder: 1,
  active: true,
  homepage: false,
  navigation: true,
};

function normalizeCategory(node: AdminCategoryNode): AdminCategoryNode {
  return {
    ...node,
    nameEn: node.nameEn ?? node.name,
    nameZh: node.nameZh ?? node.name,
    iconUrl: node.iconUrl ?? "",
    description: node.description ?? "",
    children: node.children?.map(normalizeCategory) ?? [],
  };
}

function flattenCategories(tree: AdminCategoryNode[], depth = 0, parentId = "", pathEn = "", pathZh = ""): FlatCategory[] {
  return tree.flatMap((node) => {
    const nextPathEn = pathEn ? `${pathEn} > ${node.nameEn}` : node.nameEn;
    const nextPathZh = pathZh ? `${pathZh} > ${node.nameZh}` : node.nameZh;
    return [
      { node, depth, parentId, pathEn: nextPathEn, pathZh: nextPathZh },
      ...flattenCategories(node.children ?? [], depth + 1, node.id, nextPathEn, nextPathZh),
    ];
  });
}

function findCategory(tree: AdminCategoryNode[], id: string): AdminCategoryNode | undefined {
  for (const node of tree) {
    if (node.id === id) {
      return node;
    }

    const found = findCategory(node.children ?? [], id);
    if (found) {
      return found;
    }
  }
}

function updateCategory(tree: AdminCategoryNode[], id: string, patch: Partial<AdminCategoryNode>): AdminCategoryNode[] {
  return tree.map((node) => {
    if (node.id === id) {
      return { ...node, ...patch };
    }

    return { ...node, children: updateCategory(node.children ?? [], id, patch) };
  });
}

function removeCategory(tree: AdminCategoryNode[], id: string): { tree: AdminCategoryNode[]; removed?: AdminCategoryNode } {
  let removed: AdminCategoryNode | undefined;
  const next = tree
    .map((node) => {
      if (node.id === id) {
        removed = node;
        return null;
      }

      const childResult = removeCategory(node.children ?? [], id);
      if (childResult.removed) {
        removed = childResult.removed;
      }

      return { ...node, children: childResult.tree };
    })
    .filter(Boolean) as AdminCategoryNode[];

  return { tree: next, removed };
}

function insertCategory(tree: AdminCategoryNode[], parentId: string, category: AdminCategoryNode): AdminCategoryNode[] {
  if (!parentId) {
    return [...tree, category].map((node, index) => ({ ...node, sortOrder: index + 1 }));
  }

  return tree.map((node) => {
    if (node.id === parentId) {
      const children = [...(node.children ?? []), category].map((child, index) => ({ ...child, sortOrder: index + 1 }));
      return { ...node, children };
    }

    return { ...node, children: insertCategory(node.children ?? [], parentId, category) };
  });
}

function reorderCategory(tree: AdminCategoryNode[], id: string, direction: -1 | 1): AdminCategoryNode[] {
  const index = tree.findIndex((node) => node.id === id);
  if (index >= 0) {
    const target = index + direction;
    if (target < 0 || target >= tree.length) {
      return tree;
    }

    const next = [...tree];
    [next[index], next[target]] = [next[target], next[index]];
    return next.map((node, orderIndex) => ({ ...node, sortOrder: orderIndex + 1 }));
  }

  return tree.map((node) => ({ ...node, children: reorderCategory(node.children ?? [], id, direction) }));
}

function subtreeDepth(node: AdminCategoryNode): number {
  if (!node.children?.length) {
    return 1;
  }

  return 1 + Math.max(...node.children.map(subtreeDepth));
}

function isDescendant(flat: FlatCategory[], sourceId: string, targetId: string) {
  const source = flat.find((item) => item.node.id === sourceId);
  const target = flat.find((item) => item.node.id === targetId);
  return Boolean(source && target && target.pathEn.startsWith(`${source.pathEn} >`));
}

function canMoveUnder(tree: AdminCategoryNode[], flat: FlatCategory[], sourceId: string | undefined, parentId: string) {
  const sourceDepth = sourceId ? subtreeDepth(findCategory(tree, sourceId) ?? adminCategories[0]) : 1;
  const parentDepth = parentId ? flat.find((item) => item.node.id === parentId)?.depth ?? 0 : -1;
  return parentDepth + 1 + sourceDepth <= 3;
}

function makeCategory(form: CategoryForm): AdminCategoryNode {
  const safeId = form.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    id: form.id ?? `${safeId || "category"}-${Date.now()}`,
    name: form.nameEn,
    nameEn: form.nameEn,
    nameZh: form.nameZh || form.nameEn,
    iconUrl: form.iconUrl,
    description: form.description,
    productCount: form.productCount,
    sortOrder: form.sortOrder,
    active: form.active,
    homepage: form.homepage,
    navigation: form.navigation,
    children: [],
  };
}

function CategoriesContent() {
  const { language, t } = useAdminI18n();
  const [tree, setTree] = useState<AdminCategoryNode[]>(() => {
    if (typeof window === "undefined") {
      return adminCategories.map(normalizeCategory);
    }

    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as AdminCategoryNode[]).map(normalizeCategory) : adminCategories.map(normalizeCategory);
  });
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [notice, setNotice] = useState("");
  const [moveSourceId, setMoveSourceId] = useState("");
  const [moveTargetId, setMoveTargetId] = useState("");
  const [mergeSourceId, setMergeSourceId] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const flat = useMemo(() => flattenCategories(tree), [tree]);

  const saveTree = (nextTree: AdminCategoryNode[]) => {
    setTree(nextTree);
    window.localStorage.setItem(storageKey, JSON.stringify(nextTree));
  };

  const resetForm = (parentId = "") => {
    setNotice("");
    setForm({ ...emptyForm, parentId });
  };

  const displayName = (node: AdminCategoryNode) => (language === "zh" ? node.nameZh : node.nameEn);
  const displayPath = (item: FlatCategory) => (language === "zh" ? item.pathZh : item.pathEn);
  const parentOptions = flat.filter(
    (item) =>
      item.depth < 2 &&
      item.node.id !== form.id &&
      !isDescendant(flat, form.id ?? "", item.node.id) &&
      canMoveUnder(tree, flat, form.id, item.node.id),
  );

  const handleSave = () => {
    if (!form.nameEn.trim()) {
      return;
    }

    if (!canMoveUnder(tree, flat, form.id, form.parentId)) {
      setNotice(t("maxDepthWarning"));
      return;
    }

    if (form.id) {
      const existing = findCategory(tree, form.id);
      if (!existing) {
        return;
      }

      const updated = { ...existing, ...makeCategory(form), children: existing.children ?? [] };
      const removed = removeCategory(tree, form.id);
      saveTree(insertCategory(removed.tree, form.parentId, updated));
    } else {
      saveTree(insertCategory(tree, form.parentId, makeCategory(form)));
    }

    setNotice(t("toolApplied"));
    setForm(emptyForm);
  };

  const editCategory = (item: FlatCategory) => {
    setForm({
      id: item.node.id,
      nameEn: item.node.nameEn,
      nameZh: item.node.nameZh,
      parentId: item.parentId,
      iconUrl: item.node.iconUrl,
      description: item.node.description,
      productCount: item.node.productCount,
      sortOrder: item.node.sortOrder,
      active: item.node.active,
      homepage: item.node.homepage,
      navigation: item.node.navigation,
    });
  };

  const toggleCategory = (id: string, key: "active" | "homepage" | "navigation") => {
    const current = findCategory(tree, id);
    if (current) {
      saveTree(updateCategory(tree, id, { [key]: !current[key] }));
    }
  };

  const deleteCategory = (category: AdminCategoryNode) => {
    if (category.productCount > 0) {
      setNotice(t("deleteProductWarning"));
      return;
    }

    if ((category.children?.length ?? 0) > 0) {
      setNotice(t("deleteChildWarning"));
      return;
    }

    saveTree(removeCategory(tree, category.id).tree);
    setNotice(t("toolApplied"));
  };

  const moveCategory = (sourceId: string, targetId: string) => {
    if (!sourceId || sourceId === targetId || isDescendant(flat, sourceId, targetId)) {
      return;
    }

    if (!canMoveUnder(tree, flat, sourceId, targetId)) {
      setNotice(t("maxDepthWarning"));
      return;
    }

    const removed = removeCategory(tree, sourceId);
    if (!removed.removed) {
      return;
    }

    saveTree(insertCategory(removed.tree, targetId, removed.removed));
    setNotice(t("toolApplied"));
  };

  const mergeCategory = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId || isDescendant(flat, sourceId, targetId)) {
      return;
    }

    const source = findCategory(tree, sourceId);
    const target = findCategory(tree, targetId);
    if (!source || !target) {
      return;
    }

    if ((source.children?.length ?? 0) > 0) {
      setNotice(t("deleteChildWarning"));
      return;
    }

    const movedProducts = updateCategory(tree, targetId, { productCount: target.productCount + source.productCount });
    saveTree(removeCategory(movedProducts, sourceId).tree);
    setNotice(`${t("mergeConfirmation")} ${t("toolApplied")}`);
  };

  return (
    <>
      <AdminPageTitle titleKey="categories" caption={t("categoryTreeHint")} />
      <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_430px]">
        <div className="rounded-md border border-orange-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => resetForm("")} className="rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white">
              {t("addMainCategory")}
            </button>
            <StatusPill tone="orange">{t("disabledHidden")}</StatusPill>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{t("categoryRules")}</p>
          {notice ? (
            <p className="mt-4 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
              {notice}
            </p>
          ) : null}
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black text-zinc-950">{form.id ? t("edit") : t("createCategory")}</p>
          <div className="mt-4 grid gap-3">
            <input value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} placeholder={t("categoryNameEn")} className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-orange-500" />
            <input value={form.nameZh} onChange={(event) => setForm({ ...form, nameZh: event.target.value })} placeholder={t("categoryNameZh")} className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-orange-500" />
            <select value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })} className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-orange-500">
              <option value="">{t("noParent")}</option>
              {parentOptions.map((item) => (
                <option key={item.node.id} value={item.node.id}>
                  {displayPath(item)}
                </option>
              ))}
            </select>
            <input value={form.iconUrl} onChange={(event) => setForm({ ...form, iconUrl: event.target.value })} placeholder={t("iconImageUrl")} className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-orange-500" />
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={t("description")} className="min-h-20 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min={0} value={form.productCount} onChange={(event) => setForm({ ...form, productCount: Math.max(0, Number(event.target.value) || 0) })} className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-orange-500" aria-label={t("productCount")} />
              <input type="number" min={1} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Math.max(1, Number(event.target.value) || 1) })} className="h-10 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-orange-500" aria-label={t("sortOrder")} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-bold text-zinc-700">
              {(["active", "homepage", "navigation"] as const).map((key) => (
                <button key={key} type="button" onClick={() => setForm({ ...form, [key]: !form[key] })} className={`rounded-md border px-2 py-2 ${form[key] ? "border-orange-200 bg-orange-50 text-orange-700" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>
                  {key === "active" ? t("activeToggle") : key === "homepage" ? t("showHomepage") : t("showNavigation")}
                </button>
              ))}
            </div>
            <button type="button" onClick={handleSave} className="h-10 rounded-md bg-zinc-950 text-sm font-black text-white">
              {t("save")}
            </button>
          </div>
        </div>
      </div>

      <TableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1420px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t("activeToggle")}</th>
                <th className="px-4 py-3">{t("showHomepage")}</th>
                <th className="px-4 py-3">{t("showNavigation")}</th>
                <th className="px-4 py-3">{t("categoryNameEn")}</th>
                <th className="px-4 py-3">{t("categoryNameZh")}</th>
                <th className="px-4 py-3">{t("parentCategory")}</th>
                <th className="px-4 py-3">{t("productCount")}</th>
                <th className="px-4 py-3">{t("sortOrder")}</th>
                <th className="px-4 py-3">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {flat.map((item) => {
                const parent = flat.find((parentItem) => parentItem.node.id === item.parentId);

                return (
                  <tr key={item.node.id} className={item.node.active ? "bg-white" : "bg-zinc-50"}>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => toggleCategory(item.node.id, "active")} aria-label={t("activeToggle")}>
                        <AdminToggle checked={item.node.active} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => toggleCategory(item.node.id, "homepage")} aria-label={t("showHomepage")}>
                        <AdminToggle checked={item.node.homepage} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => toggleCategory(item.node.id, "navigation")} aria-label={t("showNavigation")}>
                        <AdminToggle checked={item.node.navigation} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3" style={{ paddingLeft: item.depth * 24 }}>
                        <span className={`h-2 w-2 rounded-full ${item.node.active ? "bg-[#f65f18]" : "bg-zinc-300"}`} />
                        <div>
                          <p className="font-black text-zinc-950">{item.node.nameEn}</p>
                          <p className="text-xs font-bold text-zinc-400">{item.pathEn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-zinc-700">{item.node.nameZh}</td>
                    <td className="px-4 py-3 text-zinc-600">{parent ? displayName(parent.node) : t("noParent")}</td>
                    <td className="px-4 py-3 font-black text-zinc-700">{item.node.productCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-700">{item.node.sortOrder}</span>
                        <button type="button" onClick={() => saveTree(reorderCategory(tree, item.node.id, -1))} className="rounded border border-zinc-200 px-2 py-1 font-black">Up</button>
                        <button type="button" onClick={() => saveTree(reorderCategory(tree, item.node.id, 1))} className="rounded border border-zinc-200 px-2 py-1 font-black">Down</button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => resetForm(item.node.id)} disabled={item.depth >= 2} className="rounded-md border border-orange-200 px-3 py-2 text-xs font-black text-orange-700 disabled:border-zinc-200 disabled:text-zinc-400">
                          {t("addChild")}
                        </button>
                        <button type="button" onClick={() => editCategory(item)} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">{t("edit")}</button>
                        <button type="button" onClick={() => toggleCategory(item.node.id, "active")} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">{item.node.active ? t("disable") : t("enable")}</button>
                        <button type="button" onClick={() => setMoveSourceId(item.node.id)} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">{t("move")}</button>
                        <button type="button" onClick={() => setMergeSourceId(item.node.id)} className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700">{t("mergeCategory")}</button>
                        <button type="button" onClick={() => deleteCategory(item.node)} className="rounded-md border border-red-200 px-3 py-2 text-xs font-black text-red-700">{t("delete")}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TableShell>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <CategoryTool
          title={t("moveCategory")}
          sourceLabel={t("sourceCategory")}
          targetLabel={t("parentCategory")}
          sourceId={moveSourceId}
          targetId={moveTargetId}
          setSourceId={setMoveSourceId}
          setTargetId={setMoveTargetId}
          sourceOptions={flat}
          targetOptions={flat}
          allowRoot
          onApply={moveCategory}
        />
        <CategoryTool
          title={t("mergeCategory")}
          caption={t("mergeConfirmation")}
          sourceLabel={t("sourceCategory")}
          targetLabel={t("targetCategory")}
          sourceId={mergeSourceId}
          targetId={mergeTargetId}
          setSourceId={setMergeSourceId}
          setTargetId={setMergeTargetId}
          sourceOptions={flat}
          targetOptions={flat}
          onApply={mergeCategory}
        />
      </div>
    </>
  );
}

function CategoryTool({
  title,
  caption,
  sourceLabel,
  targetLabel,
  sourceId,
  targetId,
  setSourceId,
  setTargetId,
  sourceOptions,
  targetOptions,
  allowRoot,
  onApply,
}: {
  title: string;
  caption?: string;
  sourceLabel: string;
  targetLabel: string;
  sourceId: string;
  targetId: string;
  setSourceId: (id: string) => void;
  setTargetId: (id: string) => void;
  sourceOptions: FlatCategory[];
  targetOptions: FlatCategory[];
  allowRoot?: boolean;
  onApply: (sourceId: string, targetId: string) => void;
}) {
  const { language, t } = useAdminI18n();

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-black text-zinc-950">{title}</p>
      {caption ? <p className="mt-2 rounded-md bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700">{caption}</p> : null}
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="text-xs font-bold text-zinc-600">
          {sourceLabel}
          <select value={sourceId} onChange={(event) => setSourceId(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm">
            <option value="">{t("category")}</option>
            {sourceOptions.map((item) => (
              <option key={item.node.id} value={item.node.id}>
                {language === "zh" ? item.pathZh : item.pathEn}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-zinc-600">
          {targetLabel}
          <select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm">
            {allowRoot ? <option value="">{t("noParent")}</option> : <option value="">{t("category")}</option>}
            {targetOptions
              .filter((item) => item.node.id !== sourceId)
              .map((item) => (
                <option key={item.node.id} value={item.node.id}>
                  {language === "zh" ? item.pathZh : item.pathEn}
                </option>
              ))}
          </select>
        </label>
        <button type="button" onClick={() => onApply(sourceId, targetId)} className="h-10 rounded-md bg-[#f65f18] px-4 text-sm font-black text-white">
          {t("move")}
        </button>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <AdminShell>
      <CategoriesContent />
    </AdminShell>
  );
}
