create table if not exists public.admin_action_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.admin_users(id) on delete set null,
  admin_email text,
  admin_role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  entity_label text,
  previous_data jsonb,
  new_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_action_audit_logs_admin_user_id
on public.admin_action_audit_logs(admin_user_id);

create index if not exists idx_admin_action_audit_logs_entity
on public.admin_action_audit_logs(entity_type, entity_id);

create index if not exists idx_admin_action_audit_logs_action
on public.admin_action_audit_logs(action);

create index if not exists idx_admin_action_audit_logs_created_at
on public.admin_action_audit_logs(created_at desc);

alter table public.admin_action_audit_logs enable row level security;
