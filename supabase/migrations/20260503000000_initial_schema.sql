create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_zh text,
  slug text unique not null,
  parent_id uuid references public.categories(id),
  level int not null default 1,
  icon_url text,
  image_url text,
  active boolean default false,
  show_on_homepage boolean default false,
  show_in_navigation boolean default false,
  sort_order int default 0,
  template_type text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  slug text unique not null,
  category_id uuid references public.categories(id),
  subcategory_id uuid references public.categories(id),
  child_category_id uuid references public.categories(id),
  brand text,
  model text,
  moq int default 1,
  stock_status text default 'for_order',
  lead_time text,
  image_url text,
  description text,
  supplier_notes text,
  internal_cost_notes text,
  admin_notes text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  image_url text not null,
  sort_order int default 0
);

create table if not exists public.product_price_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid,
  min_qty int not null,
  max_qty int,
  unit_price numeric(12,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  name text not null,
  phone text,
  facebook_name text,
  messenger_link text,
  location text,
  business_type text,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  customer_id uuid references public.customers(id),
  product_total numeric(12,2) default 0,
  order_status text default 'pending_confirmation',
  payment_status text default 'no_payment',
  receiver_name text,
  receiver_phone text,
  receiving_method text,
  complete_address text,
  shipping_fee_payment_method text,
  shipping_fee_amount numeric(12,2),
  shipping_fee_status text default 'to_be_confirmed',
  order_notes text,
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name_snapshot text,
  sku_snapshot text,
  quantity int not null,
  unit_price_snapshot numeric(12,2) not null,
  subtotal numeric(12,2) not null,
  supplier_notes_snapshot text
);

create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  payment_method text,
  amount numeric(12,2),
  reference_no text,
  proof_image_url text,
  status text default 'pending',
  created_at timestamptz default now(),
  verified_at timestamptz
);

create index if not exists products_sku_idx on public.products (sku);
create index if not exists products_name_idx on public.products (name);
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_subcategory_id_idx on public.products (subcategory_id);
create index if not exists products_child_category_id_idx on public.products (child_category_id);
create index if not exists products_active_idx on public.products (active);
create index if not exists orders_order_no_idx on public.orders (order_no);
create index if not exists orders_order_status_idx on public.orders (order_status);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists categories_parent_id_idx on public.categories (parent_id);
create index if not exists categories_active_idx on public.categories (active);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_product_price_tiers_updated_at on public.product_price_tiers;
create trigger set_product_price_tiers_updated_at
before update on public.product_price_tiers
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

insert into public.categories
  (id, name_en, name_zh, slug, parent_id, level, icon_url, image_url, active, show_on_homepage, show_in_navigation, sort_order, template_type, description)
values
  ('00000000-0000-0000-0000-000000000001', 'Motorcycle Parts', 'Motorcycle Parts', 'motorcycle-parts', null, 1, '/products/topbox-bracket.svg', '/products/topbox-bracket.svg', true, true, true, 1, 'marketplace', 'Fast-moving scooter and motorcycle replacement parts.'),
  ('00000000-0000-0000-0000-000000000002', 'Honda Click', 'Honda Click', 'honda-click', '00000000-0000-0000-0000-000000000001', 2, '/products/flat-seat-click.svg', '/products/flat-seat-click.svg', true, true, true, 1, 'marketplace', 'Parts for Honda Click models.'),
  ('00000000-0000-0000-0000-000000000003', 'Seat', 'Seat', 'seat', '00000000-0000-0000-0000-000000000002', 3, '/products/flat-seat-click.svg', '/products/flat-seat-click.svg', true, true, true, 1, 'marketplace', 'Seat products for scooter replacement demand.'),
  ('00000000-0000-0000-0000-000000000004', 'Ignition / Keyset', 'Ignition / Keyset', 'ignition-keyset', '00000000-0000-0000-0000-000000000002', 3, '/products/ignition-keyset.svg', '/products/ignition-keyset.svg', true, false, true, 2, 'marketplace', 'Ignition and keyset replacements.'),
  ('00000000-0000-0000-0000-000000000005', 'Bracket', 'Bracket', 'bracket', '00000000-0000-0000-0000-000000000002', 3, '/products/topbox-bracket.svg', '/products/topbox-bracket.svg', true, false, true, 3, 'marketplace', 'Mounting and support brackets.'),
  ('00000000-0000-0000-0000-000000000006', 'Yamaha Mio', 'Yamaha Mio', 'yamaha-mio', '00000000-0000-0000-0000-000000000001', 2, '/products/ignition-keyset-alt.svg', '/products/ignition-keyset-alt.svg', true, false, true, 2, 'marketplace', 'Parts for Yamaha Mio models.'),
  ('00000000-0000-0000-0000-000000000007', 'NMAX', 'NMAX', 'nmax', '00000000-0000-0000-0000-000000000001', 2, '/products/topbox-bracket.svg', '/products/topbox-bracket.svg', true, true, true, 3, 'marketplace', 'NMAX parts and accessories.'),
  ('00000000-0000-0000-0000-000000000008', 'Aerox', 'Aerox', 'aerox', '00000000-0000-0000-0000-000000000001', 2, '/products/topbox-bracket-alt.svg', '/products/topbox-bracket-alt.svg', true, false, true, 4, 'marketplace', 'Aerox parts and accessories.'),
  ('00000000-0000-0000-0000-000000000009', 'Daily Essentials', 'Daily Essentials', 'daily-essentials', null, 1, '/products/contact-cleaner.svg', '/products/contact-cleaner.svg', true, true, true, 2, 'marketplace', 'Everyday wholesale supplies.'),
  ('00000000-0000-0000-0000-000000000010', 'Tissue', 'Tissue', 'tissue', '00000000-0000-0000-0000-000000000009', 2, '/products/contact-cleaner-alt.svg', '/products/contact-cleaner-alt.svg', true, true, true, 1, 'marketplace', 'Tissue and paper goods.'),
  ('00000000-0000-0000-0000-000000000011', 'Electronics', 'Electronics', 'electronics', null, 1, '/products/phone-accessories.svg', '/products/phone-accessories.svg', true, true, true, 3, 'marketplace', 'Phone accessories and electronics.'),
  ('00000000-0000-0000-0000-000000000012', 'Phone Accessories', 'Phone Accessories', 'phone-accessories', '00000000-0000-0000-0000-000000000011', 2, '/products/phone-accessories.svg', '/products/phone-accessories.svg', true, true, true, 1, 'marketplace', 'Phone accessory wholesale items.'),
  ('00000000-0000-0000-0000-000000000013', 'Food & Spices', 'Food & Spices', 'food-spices', null, 1, '/products/chili-powder.svg', '/products/chili-powder.svg', true, true, true, 4, 'marketplace', 'Food and spice wholesale products.'),
  ('00000000-0000-0000-0000-000000000014', 'Chili', 'Chili', 'chili', '00000000-0000-0000-0000-000000000013', 2, '/products/chili-powder.svg', '/products/chili-powder.svg', true, true, true, 1, 'marketplace', 'Chili products.')on conflict (slug) do update set
  name_en = excluded.name_en,
  name_zh = excluded.name_zh,
  parent_id = excluded.parent_id,
  level = excluded.level,
  icon_url = excluded.icon_url,
  image_url = excluded.image_url,
  active = excluded.active,
  show_on_homepage = excluded.show_on_homepage,
  show_in_navigation = excluded.show_in_navigation,
  sort_order = excluded.sort_order,
  template_type = excluded.template_type,
  description = excluded.description;

insert into public.products
  (id, sku, name, slug, category_id, subcategory_id, child_category_id, brand, model, moq, stock_status, lead_time, image_url, description, supplier_notes, internal_cost_notes, admin_notes, active)
values
  ('10000000-0000-0000-0000-000000000001', 'WH-MP-1001', 'Flat Seat Click 125 / 150 / 160', 'flat-seat-click-125-150-160', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'OEM Style', 'Click 125/150/160', 1, 'ready_stock', '1-2 days', '/products/flat-seat-click.svg', 'Replacement flat scooter seat with reinforced base, synthetic leather cover, and fitment for Click 125, 150, and 160 variants.', 'Supplier A: black cover only this week.', 'Target margin checked manually. Do not auto-price.', 'Top seller for repair shops.', true),
  ('10000000-0000-0000-0000-000000000002', 'WH-MP-1002', 'Ignition Keyset Mio / Click', 'ignition-keyset-mio-click', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'MotoKey', 'Mio / Click', 1, 'ready_stock', '1-2 days', '/products/ignition-keyset.svg', 'Universal-style ignition keyset for Mio and Click service replacement demand, supplied with keys and compact retail packaging.', 'Check key blank batch before large order.', 'Cost changes often; verify manually.', 'Good for bundle promotions.', true),
  ('10000000-0000-0000-0000-000000000003', 'WH-MP-1003', 'Topbox Bracket NMAX / Aerox', 'topbox-bracket-nmax-aerox', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', null, 'RideMount', 'NMAX / Aerox', 1, 'low_stock', '3-5 days', '/products/topbox-bracket.svg', 'Powder-coated rear topbox bracket for NMAX and Aerox models, made for shops selling touring and delivery-bike accessories.', 'Low stock, confirm warehouse quantity first.', 'Bulky carton affects handling cost.', 'Show low stock badge.', true),
  ('10000000-0000-0000-0000-000000000004', 'WH-DE-1004', 'Contact Cleaner Spray 450ml', 'contact-cleaner-spray-450ml', '00000000-0000-0000-0000-000000000009', null, null, 'CleanPro', '450ml', 1, 'ready_stock', 'Same day', '/products/contact-cleaner.svg', 'Fast-drying 450ml contact cleaner spray for electrical contacts, switches, workshop maintenance, and counter sales.', 'Aerosol cartons must be handled separately.', 'Manual pricing due to hazmat handling.', 'Consumable repeat item.', true),
  ('10000000-0000-0000-0000-000000000005', 'WH-MP-1005', 'Brake Lever with Lock', 'brake-lever-with-lock', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', null, 'SafeRide', 'Universal Scooter', 2, 'for_order', '7-10 days', '/products/topbox-bracket-alt.svg', 'Brake lever with integrated lock for scooter resale.', 'For order only; supplier confirms every Friday.', 'No automatic price update.', 'Add real product image later.', true),
  ('10000000-0000-0000-0000-000000000006', 'WH-DE-1006', 'Koby De Rust', 'koby-de-rust', '00000000-0000-0000-0000-000000000009', null, null, 'Koby', 'De Rust', 6, 'ready_stock', '2-3 days', '/products/contact-cleaner-alt.svg', 'Rust remover for workshop and household use.', 'Case quantity 24 pieces.', 'Check leakage allowance manually.', 'Candidate for bulk upload test.', true),
  ('10000000-0000-0000-0000-000000000007', 'WH-MP-1007', 'MKT Coolant 500ml', 'mkt-coolant-500ml', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', null, 'MKT', '500ml', 12, 'low_stock', '3-5 days', '/products/contact-cleaner.svg', 'Motorcycle coolant bottle for service shops.', 'Temporarily hidden until new stock arrives.', 'Hidden product must not show on customer frontend.', 'Review packaging image.', true),
  ('10000000-0000-0000-0000-000000000008', 'WH-FS-1008', 'Chili Powder 100g', 'chili-powder-100g', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000014', null, 'KitchenMart', '100g pouch', 24, 'ready_stock', 'Same day', '/products/chili-powder.svg', 'Retail-ready 100g chili powder pouch.', 'Keep away from moisture.', 'Manual promo pricing only.', 'Food category demo item.', true),
  ('10000000-0000-0000-0000-000000000009', 'WH-EL-1009', 'Phone Charger Cable', 'phone-charger-cable', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000012', null, 'VoltLine', 'USB-C 1m', 10, 'for_order', 'Pending supplier', '/products/phone-accessories.svg', 'USB-C charging cable for counter resale.', 'Do not publish until cable certification is confirmed.', 'Cost pending.', 'Use as hidden product example.', true)
on conflict (sku) do update set
  name = excluded.name,
  slug = excluded.slug,
  category_id = excluded.category_id,
  subcategory_id = excluded.subcategory_id,
  child_category_id = excluded.child_category_id,
  brand = excluded.brand,
  model = excluded.model,
  moq = excluded.moq,
  stock_status = excluded.stock_status,
  lead_time = excluded.lead_time,
  image_url = excluded.image_url,
  description = excluded.description,
  supplier_notes = excluded.supplier_notes,
  internal_cost_notes = excluded.internal_cost_notes,
  admin_notes = excluded.admin_notes,
  active = excluded.active;

insert into public.product_images (product_id, image_url, sort_order)
select id, image_url, 1 from public.products
where sku in ('WH-MP-1001', 'WH-MP-1002', 'WH-MP-1003', 'WH-DE-1004', 'WH-MP-1005', 'WH-DE-1006', 'WH-MP-1007', 'WH-FS-1008', 'WH-EL-1009')
on conflict do nothing;

delete from public.product_price_tiers
where product_id in (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000008',
  '10000000-0000-0000-0000-000000000009'
);

insert into public.product_price_tiers (product_id, min_qty, max_qty, unit_price)
select product_id, min_qty, max_qty, unit_price
from (
  values
    ('10000000-0000-0000-0000-000000000001'::uuid, 1, 5, 135.00), ('10000000-0000-0000-0000-000000000001'::uuid, 6, 11, 125.00), ('10000000-0000-0000-0000-000000000001'::uuid, 12, 49, 118.00), ('10000000-0000-0000-0000-000000000001'::uuid, 50, null, 110.00),
    ('10000000-0000-0000-0000-000000000002'::uuid, 1, 5, 105.00), ('10000000-0000-0000-0000-000000000002'::uuid, 6, 11, 98.00), ('10000000-0000-0000-0000-000000000002'::uuid, 12, 49, 92.00), ('10000000-0000-0000-0000-000000000002'::uuid, 50, null, 86.00),
    ('10000000-0000-0000-0000-000000000003'::uuid, 1, 5, 310.00), ('10000000-0000-0000-0000-000000000003'::uuid, 6, 11, 295.00), ('10000000-0000-0000-0000-000000000003'::uuid, 12, 49, 280.00), ('10000000-0000-0000-0000-000000000003'::uuid, 50, null, 260.00),
    ('10000000-0000-0000-0000-000000000004'::uuid, 1, 5, 95.00), ('10000000-0000-0000-0000-000000000004'::uuid, 6, 11, 88.00), ('10000000-0000-0000-0000-000000000004'::uuid, 12, 49, 82.00), ('10000000-0000-0000-0000-000000000004'::uuid, 50, null, 75.00),
    ('10000000-0000-0000-0000-000000000005'::uuid, 1, 5, 160.00), ('10000000-0000-0000-0000-000000000005'::uuid, 6, 11, 150.00), ('10000000-0000-0000-0000-000000000005'::uuid, 12, 49, 142.00), ('10000000-0000-0000-0000-000000000005'::uuid, 50, null, 132.00),
    ('10000000-0000-0000-0000-000000000006'::uuid, 1, 5, 120.00), ('10000000-0000-0000-0000-000000000006'::uuid, 6, 11, 112.00), ('10000000-0000-0000-0000-000000000006'::uuid, 12, 49, 105.00), ('10000000-0000-0000-0000-000000000006'::uuid, 50, null, 98.00),
    ('10000000-0000-0000-0000-000000000007'::uuid, 1, 5, 140.00), ('10000000-0000-0000-0000-000000000007'::uuid, 6, 11, 132.00), ('10000000-0000-0000-0000-000000000007'::uuid, 12, 49, 125.00), ('10000000-0000-0000-0000-000000000007'::uuid, 50, null, 118.00),
    ('10000000-0000-0000-0000-000000000008'::uuid, 1, 5, 65.00), ('10000000-0000-0000-0000-000000000008'::uuid, 6, 11, 60.00), ('10000000-0000-0000-0000-000000000008'::uuid, 12, 49, 56.00), ('10000000-0000-0000-0000-000000000008'::uuid, 50, null, 52.00),
    ('10000000-0000-0000-0000-000000000009'::uuid, 1, 5, 80.00), ('10000000-0000-0000-0000-000000000009'::uuid, 6, 11, 74.00), ('10000000-0000-0000-0000-000000000009'::uuid, 12, 49, 68.00), ('10000000-0000-0000-0000-000000000009'::uuid, 50, null, 62.00)
) as tiers(product_id, min_qty, max_qty, unit_price);

insert into public.customers
  (id, name, phone, facebook_name, messenger_link, location, business_type, status)
values
  ('20000000-0000-0000-0000-000000000001', 'Juan Dela Cruz', '+63 917 111 0001', 'Juan Dela Cruz', 'm.me/juandelacruz', 'Quezon City', 'Motorcycle parts reseller', 'active'),
  ('20000000-0000-0000-0000-000000000002', 'Mark Santos', '+63 918 222 0002', 'Mark Santos Shop', 'fb.com/marksantos.shop', 'Pasig', 'Retail counter', 'active'),
  ('20000000-0000-0000-0000-000000000003', 'Ana Reyes', '+63 919 333 0003', 'Ana Reyes Store', 'm.me/anareyes.store', 'Makati', 'Wholesale buyer', 'active')
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  facebook_name = excluded.facebook_name,
  messenger_link = excluded.messenger_link,
  location = excluded.location,
  business_type = excluded.business_type,
  status = excluded.status;

insert into public.orders
  (id, order_no, customer_id, product_total, order_status, payment_status, receiver_name, receiver_phone, receiving_method, complete_address, shipping_fee_payment_method, shipping_fee_amount, shipping_fee_status, order_notes, admin_notes, created_at)
values
  ('30000000-0000-0000-0000-000000000001', 'LO-2026-000001', '20000000-0000-0000-0000-000000000001', 3500.00, 'waiting_for_deposit', 'no_payment', 'Juan Dela Cruz', '+63 917 111 0001', 'courier_shipping', 'Banawe Street, Quezon City, Metro Manila', 'freight_collect', null, 'freight_collect', 'Customer prefers courier branch pickup if cheaper.', 'No shipping fee added because receiver will pay freight collect.', '2026-05-03 10:00:00+00'),
  ('30000000-0000-0000-0000-000000000002', 'LO-2026-000002', '20000000-0000-0000-0000-000000000002', 1734.00, 'deposit_paid', 'deposit_verified', 'Mark Santos', '+63 918 222 0002', 'pick_up_at_store', 'Pick up at warehouse counter', 'pickup_no_shipping_fee', 0, 'no_shipping_fee', 'Pickup by rider after deposit verification.', 'Pickup order. Do not add shipping fee.', '2026-05-02 10:00:00+00'),
  ('30000000-0000-0000-0000-000000000003', 'LO-2026-000003', '20000000-0000-0000-0000-000000000003', 5880.00, 'sourcing_items', 'deposit_submitted', 'Ana Reyes', '+63 919 333 0003', 'local_delivery_lalamove', 'Poblacion, Makati City', 'to_be_confirmed', null, 'to_be_confirmed', 'Lalamove quote needed after items are packed.', 'Confirm cable availability before finalizing.', '2026-05-01 10:00:00+00')
on conflict (order_no) do update set
  customer_id = excluded.customer_id,
  product_total = excluded.product_total,
  order_status = excluded.order_status,
  payment_status = excluded.payment_status,
  receiver_name = excluded.receiver_name,
  receiver_phone = excluded.receiver_phone,
  receiving_method = excluded.receiving_method,
  complete_address = excluded.complete_address,
  shipping_fee_payment_method = excluded.shipping_fee_payment_method,
  shipping_fee_amount = excluded.shipping_fee_amount,
  shipping_fee_status = excluded.shipping_fee_status,
  order_notes = excluded.order_notes,
  admin_notes = excluded.admin_notes;

delete from public.order_items where order_id in (
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000003'
);

insert into public.order_items
  (order_id, product_id, product_name_snapshot, sku_snapshot, quantity, unit_price_snapshot, subtotal, supplier_notes_snapshot)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Flat Seat Click 125 / 150 / 160', 'WH-MP-1001', 10, 250.00, 2500.00, 'Supplier A: black cover only this week.'),
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Ignition Keyset Mio / Click', 'WH-MP-1002', 10, 100.00, 1000.00, 'Check key blank batch before large order.'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'Contact Cleaner Spray 450ml', 'WH-DE-1004', 12, 95.00, 1140.00, 'Aerosol cartons must be handled separately.'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000008', 'Chili Powder 100g', 'WH-FS-1008', 18, 33.00, 594.00, 'Keep away from moisture.'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Topbox Bracket NMAX / Aerox', 'WH-MP-1003', 20, 210.00, 4200.00, 'Low stock, confirm warehouse quantity first.'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000009', 'Phone Charger Cable', 'WH-EL-1009', 60, 28.00, 1680.00, 'Do not publish until cable certification is confirmed.');

delete from public.payment_records where order_id in (
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000003'
);

insert into public.payment_records
  (order_id, payment_method, amount, reference_no, status, created_at, verified_at)
values
  ('30000000-0000-0000-0000-000000000002', 'GCash', 500.00, 'GC-771203', 'verified', '2026-05-02 12:00:00+00', '2026-05-02 13:00:00+00'),
  ('30000000-0000-0000-0000-000000000003', 'Bank Transfer', 1500.00, 'BPI-552019', 'pending', '2026-05-01 11:00:00+00', null);


