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
  excludeId?: string,
) {
  const { data, error } = await admin.from("categories").select("id,slug").eq("slug", payload.slug);

  if (error) {
    return error.message;
  }

  const duplicate = (data ?? []).find((category) => category.id !== excludeId);
  return duplicate ? "Category slug already exists." : "";
}

export async function POST(request: Request) {
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

  const payloadResult = parseCategoryPayload((await request.json().catch(() => ({}))) as Record<string, unknown>);

  if ("error" in payloadResult) {
    return jsonError(payloadResult.error);
  }

  const payload = payloadResult.value;
  const uniqueError = await assertUniqueSlug(admin, payload);

  if (uniqueError) {
    return jsonError(uniqueError, 409);
  }

  try {
    const parentLevel = await getParentLevel(admin, payload.parentId);
    const level = parentLevel + 1;

    if (level > 3) {
      return jsonError("Move blocked: category depth cannot exceed 3 levels.");
    }

    const { data, error } = await admin
      .from("categories")
      .insert({
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
      .select("id")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Category creation failed.", 500);
    }

    revalidateCatalogPages();
    await writeAdminAuditLog({
      supabase: admin,
      admin: guard.admin,
      action: "category_created",
      entityType: "category",
      entityId: (data as { id: string }).id,
      entityLabel: payload.slug,
      newData: {
        name_en: payload.nameEn,
        name_zh: payload.nameZh,
        slug: payload.slug,
        parent_id: payload.parentId,
        level,
        active: payload.active,
        show_on_homepage: payload.showOnHomepage,
        show_in_navigation: payload.showInNavigation,
      },
    });

    return NextResponse.json({ ok: true, categoryId: (data as { id: string }).id });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Category creation failed.", 500);
  }
}
