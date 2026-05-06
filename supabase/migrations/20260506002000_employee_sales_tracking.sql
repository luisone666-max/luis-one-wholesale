alter table public.orders
  add column if not exists sales_admin_user_id uuid references public.admin_users(id),
  add column if not exists sales_name_snapshot text,
  add column if not exists sales_assigned_at timestamptz,
  add column if not exists sales_assigned_by_admin_user_id uuid references public.admin_users(id);

create index if not exists idx_orders_sales_admin_user_id on public.orders(sales_admin_user_id);
create index if not exists idx_orders_created_at on public.orders(created_at);
