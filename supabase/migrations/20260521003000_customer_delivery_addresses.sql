create table if not exists public.customer_delivery_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null default 'Default COD address',
  receiver_name text,
  receiver_phone text,
  delivery_province text not null,
  delivery_city text not null,
  delivery_barangay text not null,
  delivery_street_address text not null,
  delivery_landmark text,
  delivery_notes text,
  complete_address text not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  geolocation_accuracy_m numeric(10,2),
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_customer_delivery_addresses_one_default
on public.customer_delivery_addresses(customer_id)
where is_default = true;

create index if not exists idx_customer_delivery_addresses_customer_id
on public.customer_delivery_addresses(customer_id);

create index if not exists idx_customer_delivery_addresses_area
on public.customer_delivery_addresses(delivery_province, delivery_city, delivery_barangay);

drop trigger if exists set_customer_delivery_addresses_updated_at on public.customer_delivery_addresses;
create trigger set_customer_delivery_addresses_updated_at
before update on public.customer_delivery_addresses
for each row execute function public.set_updated_at();

alter table public.customer_delivery_addresses enable row level security;

drop policy if exists "Customers can read own delivery addresses" on public.customer_delivery_addresses;
create policy "Customers can read own delivery addresses"
on public.customer_delivery_addresses
for select
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = customer_delivery_addresses.customer_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can insert own delivery addresses" on public.customer_delivery_addresses;
create policy "Customers can insert own delivery addresses"
on public.customer_delivery_addresses
for insert
to authenticated
with check (
  exists (
    select 1
    from public.customers
    where customers.id = customer_delivery_addresses.customer_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can update own delivery addresses" on public.customer_delivery_addresses;
create policy "Customers can update own delivery addresses"
on public.customer_delivery_addresses
for update
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = customer_delivery_addresses.customer_id
      and customers.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.customers
    where customers.id = customer_delivery_addresses.customer_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can delete own delivery addresses" on public.customer_delivery_addresses;
create policy "Customers can delete own delivery addresses"
on public.customer_delivery_addresses
for delete
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = customer_delivery_addresses.customer_id
      and customers.auth_user_id = auth.uid()
  )
);
