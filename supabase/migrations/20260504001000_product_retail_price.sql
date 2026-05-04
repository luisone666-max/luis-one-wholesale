alter table public.products
add column if not exists retail_price numeric(12,2);

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
  updated_at,
  retail_price
from public.products
where active = true;

grant select on public.customer_products to anon, authenticated;
