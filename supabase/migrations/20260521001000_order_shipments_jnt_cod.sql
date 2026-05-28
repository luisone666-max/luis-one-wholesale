create table if not exists public.order_shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'jnt',
  provider_service text not null default 'cod',
  booking_reference text,
  tracking_no text,
  waybill_no text,
  label_url text,
  shipment_status text not null default 'draft'
    check (shipment_status in ('draft', 'ready_to_book', 'booked', 'in_transit', 'delivered', 'returning', 'returned', 'cancelled', 'failed')),
  cod_status text not null default 'pending_collection'
    check (cod_status in ('not_cod', 'pending_collection', 'collected', 'remitted', 'failed', 'waived')),
  cod_amount numeric(12,2),
  cod_currency text not null default 'PHP',
  package_weight_grams numeric(10,2),
  package_length_cm numeric(8,2),
  package_width_cm numeric(8,2),
  package_height_cm numeric(8,2),
  sender_name text,
  sender_phone text,
  sender_address text,
  receiver_name text,
  receiver_phone text,
  receiver_address text,
  notes text,
  api_request jsonb,
  api_response jsonb,
  tracking_events jsonb not null default '[]'::jsonb,
  last_tracked_at timestamptz,
  created_by_admin_user_id uuid references public.admin_users(id) on delete set null,
  updated_by_admin_user_id uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_shipments_cod_amount_nonnegative check (cod_amount is null or cod_amount >= 0),
  constraint order_shipments_package_weight_nonnegative check (package_weight_grams is null or package_weight_grams >= 0),
  constraint order_shipments_package_length_nonnegative check (package_length_cm is null or package_length_cm >= 0),
  constraint order_shipments_package_width_nonnegative check (package_width_cm is null or package_width_cm >= 0),
  constraint order_shipments_package_height_nonnegative check (package_height_cm is null or package_height_cm >= 0)
);

create index if not exists idx_order_shipments_order_id
on public.order_shipments(order_id);

create index if not exists idx_order_shipments_tracking_no
on public.order_shipments(tracking_no)
where tracking_no is not null;

create index if not exists idx_order_shipments_waybill_no
on public.order_shipments(waybill_no)
where waybill_no is not null;

create index if not exists idx_order_shipments_status
on public.order_shipments(shipment_status);

create index if not exists idx_order_shipments_cod_status
on public.order_shipments(cod_status);

create index if not exists idx_order_shipments_created_at
on public.order_shipments(created_at desc);

drop trigger if exists set_order_shipments_updated_at on public.order_shipments;
create trigger set_order_shipments_updated_at
before update on public.order_shipments
for each row execute function public.set_updated_at();

alter table public.order_shipments enable row level security;
