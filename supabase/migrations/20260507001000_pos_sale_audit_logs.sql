create table if not exists public.pos_sale_audit_logs (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete cascade,
  action text not null,
  previous_status text,
  new_status text,
  reason text,
  snapshot jsonb,
  created_by_admin_user_id uuid references public.admin_users(id),
  created_by_name_snapshot text,
  created_at timestamptz default now()
);

create index if not exists idx_pos_sale_audit_logs_sale_id
on public.pos_sale_audit_logs(sale_id);

create index if not exists idx_pos_sale_audit_logs_action
on public.pos_sale_audit_logs(action);

create index if not exists idx_pos_sale_audit_logs_created_at
on public.pos_sale_audit_logs(created_at);

alter table public.pos_sale_audit_logs enable row level security;
