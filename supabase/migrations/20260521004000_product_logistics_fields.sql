alter table public.products
  add column if not exists weight_grams numeric(10,2),
  add column if not exists length_cm numeric(8,2),
  add column if not exists width_cm numeric(8,2),
  add column if not exists height_cm numeric(8,2),
  add column if not exists cod_enabled boolean not null default true,
  add column if not exists fragile boolean not null default false,
  add column if not exists contains_battery boolean not null default false,
  add column if not exists contains_liquid boolean not null default false,
  add column if not exists shipping_category text not null default 'standard',
  add column if not exists shipping_notes text;

alter table public.product_variants
  add column if not exists weight_grams numeric(10,2),
  add column if not exists length_cm numeric(8,2),
  add column if not exists width_cm numeric(8,2),
  add column if not exists height_cm numeric(8,2),
  add column if not exists cod_enabled boolean not null default true,
  add column if not exists fragile boolean not null default false,
  add column if not exists contains_battery boolean not null default false,
  add column if not exists contains_liquid boolean not null default false,
  add column if not exists shipping_category text not null default 'standard',
  add column if not exists shipping_notes text;

alter table public.products
  drop constraint if exists products_weight_grams_positive,
  add constraint products_weight_grams_positive check (weight_grams is null or weight_grams > 0),
  drop constraint if exists products_length_cm_positive,
  add constraint products_length_cm_positive check (length_cm is null or length_cm > 0),
  drop constraint if exists products_width_cm_positive,
  add constraint products_width_cm_positive check (width_cm is null or width_cm > 0),
  drop constraint if exists products_height_cm_positive,
  add constraint products_height_cm_positive check (height_cm is null or height_cm > 0),
  drop constraint if exists products_shipping_category_valid,
  add constraint products_shipping_category_valid check (shipping_category in ('standard', 'oversized', 'fragile', 'restricted'));

alter table public.product_variants
  drop constraint if exists product_variants_weight_grams_positive,
  add constraint product_variants_weight_grams_positive check (weight_grams is null or weight_grams > 0),
  drop constraint if exists product_variants_length_cm_positive,
  add constraint product_variants_length_cm_positive check (length_cm is null or length_cm > 0),
  drop constraint if exists product_variants_width_cm_positive,
  add constraint product_variants_width_cm_positive check (width_cm is null or width_cm > 0),
  drop constraint if exists product_variants_height_cm_positive,
  add constraint product_variants_height_cm_positive check (height_cm is null or height_cm > 0),
  drop constraint if exists product_variants_shipping_category_valid,
  add constraint product_variants_shipping_category_valid check (shipping_category in ('standard', 'oversized', 'fragile', 'restricted'));
