create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid,
  quantity int not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint cart_items_quantity_positive check (quantity > 0)
);

create unique index if not exists cart_items_customer_product_variant_key
on public.cart_items (
  customer_id,
  product_id,
  coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create index if not exists idx_cart_items_customer_id on public.cart_items(customer_id);
create index if not exists idx_cart_items_product_id on public.cart_items(product_id);

grant select, insert, update, delete on public.cart_items to authenticated;

drop trigger if exists set_cart_items_updated_at on public.cart_items;
create trigger set_cart_items_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

alter table public.cart_items enable row level security;

drop policy if exists "Customers can read own cart items" on public.cart_items;
create policy "Customers can read own cart items"
on public.cart_items
for select
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = cart_items.customer_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can insert own cart items" on public.cart_items;
create policy "Customers can insert own cart items"
on public.cart_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.customers
    where customers.id = cart_items.customer_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can update own cart items" on public.cart_items;
create policy "Customers can update own cart items"
on public.cart_items
for update
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = cart_items.customer_id
      and customers.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.customers
    where customers.id = cart_items.customer_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can delete own cart items" on public.cart_items;
create policy "Customers can delete own cart items"
on public.cart_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = cart_items.customer_id
      and customers.auth_user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
