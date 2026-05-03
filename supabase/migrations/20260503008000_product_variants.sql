create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_name text not null,
  variant_sku text unique,
  model text,
  fits text,
  image_url text,
  moq int default 1,
  stock_status text default 'for_order',
  lead_time text,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint product_variants_moq_positive check (moq > 0)
);

create table if not exists public.product_variant_price_tiers (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  min_qty int not null,
  max_qty int,
  unit_price numeric(12,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint product_variant_tiers_min_positive check (min_qty > 0),
  constraint product_variant_tiers_price_positive check (unit_price > 0),
  constraint product_variant_tiers_qty_order check (max_qty is null or min_qty < max_qty)
);

alter table public.order_items
add column if not exists variant_id uuid references public.product_variants(id) on delete set null,
add column if not exists variant_name_snapshot text,
add column if not exists variant_sku_snapshot text;

create index if not exists idx_product_variants_product_id on public.product_variants(product_id);
create index if not exists idx_product_variants_active on public.product_variants(active);
create index if not exists idx_product_variants_sort_order on public.product_variants(sort_order);
create index if not exists idx_product_variants_variant_sku on public.product_variants(variant_sku);
create index if not exists idx_product_variant_price_tiers_variant_id on public.product_variant_price_tiers(variant_id);
create index if not exists idx_order_items_variant_id on public.order_items(variant_id);

drop trigger if exists set_product_variants_updated_at on public.product_variants;
create trigger set_product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

drop trigger if exists set_product_variant_price_tiers_updated_at on public.product_variant_price_tiers;
create trigger set_product_variant_price_tiers_updated_at
before update on public.product_variant_price_tiers
for each row execute function public.set_updated_at();

alter table public.product_variants enable row level security;
alter table public.product_variant_price_tiers enable row level security;

grant select on public.product_variants to anon, authenticated;
grant select on public.product_variant_price_tiers to anon, authenticated;

drop policy if exists "Public can read active product variants" on public.product_variants;
create policy "Public can read active product variants"
on public.product_variants
for select
using (
  active = true
  and exists (
    select 1
    from public.customer_products
    where customer_products.id = product_variants.product_id
  )
);

drop policy if exists "Public can read active product variant price tiers" on public.product_variant_price_tiers;
create policy "Public can read active product variant price tiers"
on public.product_variant_price_tiers
for select
using (
  exists (
    select 1
    from public.product_variants
    join public.customer_products on customer_products.id = product_variants.product_id
    where product_variants.id = product_variant_price_tiers.variant_id
      and product_variants.active = true
  )
);
