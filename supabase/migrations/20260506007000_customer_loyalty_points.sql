alter table public.customers
add column if not exists points_balance int not null default 0,
add column if not exists lifetime_points int not null default 0;

create table if not exists public.customer_loyalty_point_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  points int not null check (points <> 0),
  amount numeric(12,2) not null default 0,
  note text,
  created_by_admin_user_id uuid references public.admin_users(id),
  created_at timestamptz default now(),
  constraint customer_loyalty_source_unique unique (source_type, source_id),
  constraint customer_loyalty_source_type_check check (
    source_type in ('online_order', 'pos_sale', 'manual_adjustment')
  )
);

create index if not exists idx_customer_loyalty_customer_id
on public.customer_loyalty_point_transactions(customer_id);

create index if not exists idx_customer_loyalty_created_at
on public.customer_loyalty_point_transactions(created_at);

alter table public.customer_loyalty_point_transactions enable row level security;

drop policy if exists "Customers can read own loyalty points" on public.customer_loyalty_point_transactions;
create policy "Customers can read own loyalty points"
on public.customer_loyalty_point_transactions
for select
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = customer_loyalty_point_transactions.customer_id
      and customers.auth_user_id = auth.uid()
  )
);

create or replace function public.award_customer_loyalty_points(
  p_customer_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_amount numeric,
  p_points int,
  p_note text default null,
  p_created_by_admin_user_id uuid default null
)
returns table(awarded boolean, awarded_points int)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_points int := greatest(0, p_points);
begin
  if normalized_points <= 0 then
    return query select false, 0;
    return;
  end if;

  insert into public.customer_loyalty_point_transactions (
    customer_id,
    source_type,
    source_id,
    points,
    amount,
    note,
    created_by_admin_user_id
  )
  values (
    p_customer_id,
    p_source_type,
    p_source_id,
    normalized_points,
    coalesce(p_amount, 0),
    p_note,
    p_created_by_admin_user_id
  )
  on conflict (source_type, source_id) do nothing;

  if not found then
    return query select false, normalized_points;
    return;
  end if;

  update public.customers
  set
    points_balance = coalesce(points_balance, 0) + normalized_points,
    lifetime_points = coalesce(lifetime_points, 0) + normalized_points
  where id = p_customer_id;

  return query select true, normalized_points;
end;
$$;

revoke all on function public.award_customer_loyalty_points(uuid, text, uuid, numeric, int, text, uuid) from public;
grant execute on function public.award_customer_loyalty_points(uuid, text, uuid, numeric, int, text, uuid) to service_role;
