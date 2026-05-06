create table if not exists public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  sale_no text unique not null,
  salesperson_admin_user_id uuid references public.admin_users(id),
  salesperson_employee_no text,
  salesperson_name_snapshot text,
  customer_id uuid references public.customers(id),
  customer_name_snapshot text,
  customer_phone_snapshot text,
  customer_is_member boolean default false,
  payment_method text not null default 'cash',
  product_total numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  status text not null default 'waiting_cashier',
  price_change_notes text,
  sale_notes text,
  cashier_admin_user_id uuid references public.admin_users(id),
  cashier_name_snapshot text,
  cashier_confirmed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pos_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete cascade,
  product_id uuid references public.products(id),
  variant_id uuid references public.product_variants(id),
  item_name_snapshot text not null,
  sku_snapshot text,
  quantity int not null,
  unit_price numeric(12,2) not null,
  subtotal numeric(12,2) not null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.pos_payment_confirmations (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete cascade,
  cashier_admin_user_id uuid references public.admin_users(id),
  cashier_name_snapshot text,
  payment_method text not null,
  amount numeric(12,2) not null,
  reference_no text,
  notes text,
  confirmed_at timestamptz default now()
);

create index if not exists idx_pos_sales_sale_no on public.pos_sales(sale_no);
create index if not exists idx_pos_sales_status on public.pos_sales(status);
create index if not exists idx_pos_sales_created_at on public.pos_sales(created_at);
create index if not exists idx_pos_sales_salesperson on public.pos_sales(salesperson_admin_user_id);
create index if not exists idx_pos_sale_items_sale_id on public.pos_sale_items(sale_id);
create index if not exists idx_pos_payment_confirmations_sale_id on public.pos_payment_confirmations(sale_id);

alter table public.pos_sales enable row level security;
alter table public.pos_sale_items enable row level security;
alter table public.pos_payment_confirmations enable row level security;
