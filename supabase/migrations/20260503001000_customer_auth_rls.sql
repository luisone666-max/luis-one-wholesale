create or replace view public.customer_products as
select
  id,
  sku,
  name,
  slug,
  category_id,
  subcategory_id,
  child_category_id,
  brand,
  model,
  moq,
  stock_status,
  lead_time,
  image_url,
  description,
  active,
  created_at,
  updated_at
from public.products
where active = true;

grant select on public.customer_products to anon, authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_price_tiers enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_records enable row level security;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories
for select
to anon, authenticated
using (active = true);

drop policy if exists "Public can read active product images" on public.product_images;
create policy "Public can read active product images"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.active = true
  )
);

drop policy if exists "Public can read active product price tiers" on public.product_price_tiers;
create policy "Public can read active product price tiers"
on public.product_price_tiers
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_price_tiers.product_id
      and products.active = true
  )
);

drop policy if exists "Customers can read own profile" on public.customers;
create policy "Customers can read own profile"
on public.customers
for select
to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists "Customers can insert own profile" on public.customers;
create policy "Customers can insert own profile"
on public.customers
for insert
to authenticated
with check (auth.uid() = auth_user_id);

drop policy if exists "Customers can update own profile" on public.customers;
create policy "Customers can update own profile"
on public.customers
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists "Customers can read own orders" on public.orders;
create policy "Customers can read own orders"
on public.orders
for select
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = orders.customer_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can read own order items" on public.order_items;
create policy "Customers can read own order items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    join public.customers on customers.id = orders.customer_id
    where orders.id = order_items.order_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can read own payment records" on public.payment_records;
create policy "Customers can read own payment records"
on public.payment_records
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    join public.customers on customers.id = orders.customer_id
    where orders.id = payment_records.order_id
      and customers.auth_user_id = auth.uid()
  )
);

