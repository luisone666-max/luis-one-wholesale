create table if not exists public.cash_drawer_sessions (
  id uuid primary key default gen_random_uuid(),
  business_date date not null unique,
  cashier_admin_user_id uuid references public.admin_users(id),
  cashier_name_snapshot text,
  opening_cash numeric(12,2) not null default 0,
  expected_cash numeric(12,2),
  actual_cash numeric(12,2),
  difference_amount numeric(12,2),
  status text not null default 'open',
  opening_notes text,
  closing_notes text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cash_drawer_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.cash_drawer_sessions(id) on delete cascade,
  entry_type text not null,
  amount numeric(12,2) not null,
  reason text not null,
  notes text,
  created_by_admin_user_id uuid references public.admin_users(id),
  created_by_name_snapshot text,
  created_at timestamptz not null default now()
);

create index if not exists idx_cash_drawer_sessions_business_date on public.cash_drawer_sessions(business_date);
create index if not exists idx_cash_drawer_sessions_status on public.cash_drawer_sessions(status);
create index if not exists idx_cash_drawer_entries_session_id on public.cash_drawer_entries(session_id);
create index if not exists idx_cash_drawer_entries_type on public.cash_drawer_entries(entry_type);

alter table public.cash_drawer_sessions enable row level security;
alter table public.cash_drawer_entries enable row level security;
