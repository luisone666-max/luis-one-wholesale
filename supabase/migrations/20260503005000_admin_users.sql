create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  email text,
  name text,
  role text default 'admin',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint admin_users_role_check check (role in ('owner', 'admin', 'staff'))
);

create index if not exists idx_admin_users_auth_user_id on public.admin_users(auth_user_id);
create index if not exists idx_admin_users_active on public.admin_users(active);

alter table public.admin_users enable row level security;

drop policy if exists "Admins can read own admin profile" on public.admin_users;
create policy "Admins can read own admin profile"
on public.admin_users
for select
to authenticated
using (auth.uid() = auth_user_id);
