create extension if not exists pg_trgm;

create index if not exists products_active_slug_idx
  on public.products (slug)
  where active = true;

create index if not exists products_active_category_idx
  on public.products (category_id, active, name);

create index if not exists products_active_subcategory_idx
  on public.products (subcategory_id, active, name)
  where subcategory_id is not null;

create index if not exists products_active_child_category_idx
  on public.products (child_category_id, active, name)
  where child_category_id is not null;

create index if not exists products_active_created_at_idx
  on public.products (active, created_at desc);

create index if not exists products_sku_trgm_idx
  on public.products using gin (sku gin_trgm_ops);

create index if not exists products_name_trgm_idx
  on public.products using gin (name gin_trgm_ops);

create index if not exists products_slug_trgm_idx
  on public.products using gin (slug gin_trgm_ops);

create index if not exists products_brand_trgm_idx
  on public.products using gin (brand gin_trgm_ops);

create index if not exists products_model_trgm_idx
  on public.products using gin (model gin_trgm_ops);

create index if not exists products_description_trgm_idx
  on public.products using gin (description gin_trgm_ops);

create index if not exists product_price_tiers_product_sort_idx
  on public.product_price_tiers (product_id, min_qty);

create index if not exists product_images_product_sort_idx
  on public.product_images (product_id, sort_order);

create index if not exists product_variants_active_product_sort_idx
  on public.product_variants (product_id, active, sort_order);

create index if not exists product_variants_sku_trgm_idx
  on public.product_variants using gin (variant_sku gin_trgm_ops);

create index if not exists product_variants_name_trgm_idx
  on public.product_variants using gin (variant_name gin_trgm_ops);

create index if not exists product_variants_model_trgm_idx
  on public.product_variants using gin (model gin_trgm_ops);

create index if not exists product_variants_fits_trgm_idx
  on public.product_variants using gin (fits gin_trgm_ops);

create index if not exists product_variant_price_tiers_variant_sort_idx
  on public.product_variant_price_tiers (variant_id, min_qty);

create index if not exists categories_active_navigation_idx
  on public.categories (active, show_in_navigation, level, sort_order);

create index if not exists categories_active_homepage_idx
  on public.categories (active, show_on_homepage, level, sort_order);
