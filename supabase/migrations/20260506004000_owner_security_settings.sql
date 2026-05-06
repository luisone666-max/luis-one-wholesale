create table if not exists public.owner_security_settings (
  id text primary key default 'owner',
  password_hash text not null,
  password_salt text not null,
  updated_by_admin_user_id uuid references public.admin_users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint owner_security_singleton check (id = 'owner')
);

alter table public.owner_security_settings enable row level security;
