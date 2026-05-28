alter table public.orders
  add column if not exists delivery_province text,
  add column if not exists delivery_city text,
  add column if not exists delivery_barangay text,
  add column if not exists delivery_street_address text,
  add column if not exists delivery_landmark text,
  add column if not exists delivery_notes text,
  add column if not exists delivery_latitude numeric(10,7),
  add column if not exists delivery_longitude numeric(10,7),
  add column if not exists delivery_geolocation_accuracy_m numeric(10,2),
  add column if not exists shipping_quote_provider text,
  add column if not exists shipping_quote_zone text,
  add column if not exists cod_amount numeric(12,2);

create index if not exists idx_orders_delivery_province
on public.orders(delivery_province);

create index if not exists idx_orders_delivery_city
on public.orders(delivery_city);
