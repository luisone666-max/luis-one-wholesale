import { NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/admin-audit-log";
import { parseCategoryPayload, type CategoryPayload } from "@/lib/admin-category-validation";
import { requireActiveAdminApi } from "@/lib/admin-auth";
import { canManageCategories } from "@/lib/admin-role-access";
import { revalidateCatalogPages } from "@/lib/catalog-revalidate";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

async function getCategories(admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>) {
  const { data, error } = await admin.from("categories").select("id,parent_id,level,slug").order("level", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as { id: string; parent_id: string | null; level: number; slug: string }[];
}

type CategoryNode = { id: string; parent_id: string | null; level: number };

function descendants(categories: CategoryNode[], categoryId: string): CategoryNode[] {
  const children = categories.filter((category) => category.parent_id === categoryId);
  return children.flatMap((child) => [child, ...descendants(categories, child.id)]);
}

async function getParentLevel(admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>, parentId: string | null) {
  if (!parentId) {
    return 0;
  }

  const { data, error } = await admin.from("categories").select("level").eq("id", parentId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Parent category was not found.");
  }

  return (data as { level: number }).level;
}

async function assertUniqueSlug(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  payload: CategoryPayload,
  excludeId: string,
) {
  const { data, error } = await admin.from("categories").select("id,slug").eq("slug", payload.slug);

  if (error) {
    return error.message;
  }

  const duplicate = (data ?? []).find((category) => category.id !== excludeId);
  return duplicate ? "Category slug already exists." : "";
}

async function assertMoveIsValid(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  categoryId: string,
  parentId: string | null,
) {
  if (categoryId === parentId) {
    return "Cannot move a category under itself.";
  }

  const categories = await getCategories(admin);
  const moved = categories.find((category) => category.id === categoryId);

  if (!moved) {
    return "Category was not found.";
  }

  const childNodes = descendants(categories, categoryId);

  if (parentId && childNodes.some((category) => category.id === parentId)) {
    return "Cannot move a category under its child category.";
  }

  const parentLevel = await getParentLevel(admin, parentId);
  const subtreeDepth = childNodes.length ? Math.max(...childNodes.map((child) => child.level - moved.level + 1)) + 1 : 1;

  if (parentLevel + subtreeDepth > 3) {
    return "Move blocked: category depth cannot exceed 3 levels.";
  }

  return "";
}

async function updateDescendantLevels(admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>, categoryId: string, newLevel: number) {
  const categories = await getCategories(admin);
  const moved = categories.find((category) => category.id === categoryId);

  if (!moved) {
    return;
  }

  const levelDelta = newLevel - moved.level;

  for (const child of descendants(categories, categoryId)) {
    await admin.from("categories").update({ level: child.level + levelDelta }).eq("id", child.id);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (!canManageCategories(guard.admin.role)) {
    return jsonError("Only owner or admin can manage categories.", 403);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const { id } = await params;
  const rawPayload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { data: previousCategory } = await admin
    .from("categories")
    .select("id,name_en,name_zh,slug,parent_id,level,active,show_on_homepage,show_in_navigation,sort_order")
    .eq("id", id)
    .maybeSingle();

  if (rawPayload.mode === "toggle") {
    const patch: Record<string, boolean> = {};

    for (const [incoming, column] of [
      ["active", "active"],
      ["showOnHomepage", "show_on_homepage"],
      ["showInNavigation", "show_in_navigation"],
    ] as const) {
      if (typeof rawPayload[incoming] === "boolean") {
        patch[column] = rawPayload[incoming] as boolean;
      }
    }

    if (!Object.keys(patch).length) {
      return jsonError("No toggle field was provided.");
    }

    const { error } = await admin.from("categories").update(patch).eq("id", id);

    if (error) {
      return jsonError(error.message, 500);
    }

    revalidateCatalogPages();
    await writeAdminAuditLog({
      supabase: admin,
      admin: guard.admin,
      action: "category_toggled",
      entityType: "category",
      entityId: id,
      entityLabel: typeof previousCategory?.slug === "string" ? previousCategory.slug : id,
      previousData: (previousCategory as Record<string, unknown> | null) ?? null,
      newData: patch,
    });

    return NextResponse.json({ ok: true });
  }

  if (rawPayload.mode === "reorder") {
    const sortOrder = Number(rawPayload.sortOrder);

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return jsonError("Sort Order must be 0 or higher.");
    }

    const { error } = await admin.from("categories").update({ sort_order: sortOrder }).eq("id", id);

    if (error) {
      return jsonError(error.message, 500);
    }

    revalidateCatalogPages();
    await writeAdminAuditLog({
      supabase: admin,
      admin: guard.admin,
      action: "category_reordered",
      entityType: "category",
      entityId: id,
      entityLabel: typeof previousCategory?.slug === "string" ? previousCategory.slug : id,
      previousData: (previousCategory as Record<string, unknown> | null) ?? null,
      newData: { sort_order: sortOrder },
    });

    return NextResponse.json({ ok: true });
  }

  const payloadResult = parseCategoryPayload(rawPayload);

  if ("error" in payloadResult) {
    return jsonError(payloadResult.error);
  }

  const payload = payloadResult.value;
  const uniqueError = await assertUniqueSlug(admin, payload, id);

  if (uniqueError) {
    return jsonError(uniqueError, 409);
  }

  try {
    const moveError = await assertMoveIsValid(admin, id, payload.parentId);

    if (moveError) {
      return jsonError(moveError);
    }

    const parentLevel = await getParentLevel(admin, payload.parentId);
    const level = parentLevel + 1;
    await updateDescendantLevels(admin, id, level);

    const { error } = await admin
      .from("categories")
      .update({
        name_en: payload.nameEn,
        name_zh: payload.nameZh,
        slug: payload.slug,
        parent_id: payload.parentId,
        level,
        icon_url: payload.iconUrl,
        image_url: payload.imageUrl,
        active: payload.active,
        show_on_homepage: payload.showOnHomepage,
        show_in_navigation: payload.showInNavigation,
        sort_order: payload.sortOrder,
        template_type: payload.templateType,
        description: payload.description,
      })
      .eq("id", id);

    if (error) {
      return jsonError(error.message, 500);
    }

    revalidateCatalogPages();
    await writeAdminAuditLog({
      supabase: admin,
      admin: guard.admin,
      action: "category_updated",
      entityType: "category",
      entityId: id,
      entityLabel: payload.slug,
      previousData: (previousCategory as Record<string, unknown> | null) ?? null,
      newData: {
        name_en: payload.nameEn,
        name_zh: payload.nameZh,
        slug: payload.slug,
        parent_id: payload.parentId,
        level,
        active: payload.active,
        show_on_homepage: payload.showOnHomepage,
        show_in_navigation: payload.showInNavigation,
        sort_order: payload.sortOrder,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Category update failed.", 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveAdminApi(request);

  if (guard.response) {
    return guard.response;
  }

  if (!canManageCategories(guard.admin.role)) {
    return jsonError("Only owner or admin can manage categories.", 403);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const { id } = await params;
  const { data: previousCategory } = await admin
    .from("categories")
    .select("id,name_en,name_zh,slug,parent_id,level,active,show_on_homepage,show_in_navigation,sort_order")
    .eq("id", id)
    .maybeSingle();
  const { count: childCount, error: childError } = await admin
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);

  if (childError) {
    return jsonError(childError.message, 500);
  }

  if ((childCount ?? 0) > 0) {
    return jsonError("This category has child categories. Please move or delete child categories first.", 409);
  }

  const { count: productCount, error: productError } = await admin
    .from("products")
    .select("id", { count: "exact", head: true })
    .or(`category_id.eq.${id},subcategory_id.eq.${id},child_category_id.eq.${id}`);

  if (productError) {
    return jsonError(productError.message, 500);
  }

  if ((productCount ?? 0) > 0) {
    return jsonError("This category has products. Please move or hide products before deleting.", 409);
  }

  const { error } = await admin.from("categories").delete().eq("id", id);

  if (error) {
    return jsonError(error.message, 500);
  }

  revalidateCatalogPages();
  await writeAdminAuditLog({
    supabase: admin,
    admin: guard.admin,
    action: "category_deleted",
    entityType: "category",
    entityId: id,
    entityLabel: typeof previousCategory?.slug === "string" ? previousCategory.slug : id,
    previousData: (previousCategory as Record<string, unknown> | null) ?? null,
  });

  return NextResponse.json({ ok: true });
}
