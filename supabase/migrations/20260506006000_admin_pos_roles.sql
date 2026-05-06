alter table public.admin_users
  drop constraint if exists admin_users_role_check;

alter table public.admin_users
  add constraint admin_users_role_check
  check (role in ('owner', 'admin', 'staff', 'sales', 'cashier', 'warehouse'));
