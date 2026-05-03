import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type TemplateCategory = {
  name_en: string;
  name_zh: string;
  slug: string;
  level: number;
  sort_order: number;
  template_type: string;
  description: string;
  children?: TemplateCategory[];
};

const templates: Record<string, TemplateCategory> = {
  motorcycle_parts: {
    name_en: "Motorcycle Parts",
    name_zh: "摩托车配件",
    slug: "motorcycle-parts",
    level: 1,
    sort_order: 10,
    template_type: "motorcycle_parts",
    description: "Scooter and motorcycle replacement parts.",
    children: [
      {
        name_en: "Honda Click",
        name_zh: "Honda Click",
        slug: "honda-click",
        level: 2,
        sort_order: 1,
        template_type: "motorcycle_parts",
        description: "Honda Click parts.",
        children: [
          { name_en: "Seat", name_zh: "座椅", slug: "honda-click-seat", level: 3, sort_order: 1, template_type: "motorcycle_parts", description: "Seat products." },
          { name_en: "Ignition / Keyset", name_zh: "点火 / 锁匙套", slug: "honda-click-ignition-keyset", level: 3, sort_order: 2, template_type: "motorcycle_parts", description: "Ignition and keyset parts." },
        ],
      },
      { name_en: "Yamaha Mio", name_zh: "Yamaha Mio", slug: "yamaha-mio", level: 2, sort_order: 2, template_type: "motorcycle_parts", description: "Yamaha Mio parts." },
      { name_en: "NMAX", name_zh: "NMAX", slug: "nmax", level: 2, sort_order: 3, template_type: "motorcycle_parts", description: "NMAX parts." },
      { name_en: "Aerox", name_zh: "Aerox", slug: "aerox", level: 2, sort_order: 4, template_type: "motorcycle_parts", description: "Aerox parts." },
    ],
  },
  daily_essentials: {
    name_en: "Daily Essentials",
    name_zh: "日用品",
    slug: "daily-essentials",
    level: 1,
    sort_order: 20,
    template_type: "daily_essentials",
    description: "Everyday wholesale supplies.",
    children: [
      { name_en: "Tissue", name_zh: "纸巾", slug: "tissue", level: 2, sort_order: 1, template_type: "daily_essentials", description: "Tissue and paper goods." },
      { name_en: "Cleaning Supplies", name_zh: "清洁用品", slug: "cleaning-supplies", level: 2, sort_order: 2, template_type: "daily_essentials", description: "Cleaning supplies." },
    ],
  },
  electronics: {
    name_en: "Electronics",
    name_zh: "电子产品",
    slug: "electronics",
    level: 1,
    sort_order: 30,
    template_type: "electronics",
    description: "Phone accessories and electronics.",
    children: [
      {
        name_en: "Phone Accessories",
        name_zh: "手机配件",
        slug: "phone-accessories",
        level: 2,
        sort_order: 1,
        template_type: "electronics",
        description: "Phone accessory wholesale items.",
        children: [
          { name_en: "Chargers", name_zh: "充电器", slug: "chargers", level: 3, sort_order: 1, template_type: "electronics", description: "Wall chargers." },
          { name_en: "Cables", name_zh: "数据线", slug: "cables", level: 3, sort_order: 2, template_type: "electronics", description: "Charging and data cables." },
        ],
      },
    ],
  },
  food_spices: {
    name_en: "Food & Spices",
    name_zh: "食品与香料",
    slug: "food-spices",
    level: 1,
    sort_order: 40,
    template_type: "food_spices",
    description: "Food and spice wholesale products.",
    children: [
      { name_en: "Chili", name_zh: "辣椒", slug: "chili", level: 2, sort_order: 1, template_type: "food_spices", description: "Chili products." },
      { name_en: "Pepper", name_zh: "胡椒", slug: "pepper", level: 2, sort_order: 2, template_type: "food_spices", description: "Pepper products." },
      { name_en: "Seasoning", name_zh: "调味料", slug: "seasoning", level: 2, sort_order: 3, template_type: "food_spices", description: "Seasoning products." },
    ],
  },
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function adminDevAccessAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.ADMIN_DEV_ACCESS === "true";
}

async function createMissing(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  category: TemplateCategory,
  parentId: string | null,
) {
  const { data: existing, error: existingError } = await admin.from("categories").select("id").eq("slug", category.slug).maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  let categoryId = (existing as { id: string } | null)?.id;
  let created = 0;

  if (!categoryId) {
    const { data, error } = await admin
      .from("categories")
      .insert({
        name_en: category.name_en,
        name_zh: category.name_zh,
        slug: category.slug,
        parent_id: parentId,
        level: category.level,
        active: false,
        show_on_homepage: false,
        show_in_navigation: false,
        sort_order: category.sort_order,
        template_type: category.template_type,
        description: category.description,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Template category creation failed.");
    }

    categoryId = (data as { id: string }).id;
    created += 1;
  }

  for (const child of category.children ?? []) {
    created += await createMissing(admin, child, categoryId);
  }

  return created;
}

export async function POST(request: Request) {
  if (!adminDevAccessAllowed()) {
    return jsonError("Admin API is disabled until admin authentication is added.", 403);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const payload = (await request.json().catch(() => ({}))) as { template?: string };
  const template = payload.template ? templates[payload.template] : null;

  if (!template) {
    return jsonError("Unknown category template.");
  }

  try {
    const created = await createMissing(admin, template, null);
    return NextResponse.json({ ok: true, created });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Template apply failed.", 500);
  }
}
