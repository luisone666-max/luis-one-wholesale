alter table public.admin_users
  add column if not exists employee_no text,
  add column if not exists notes text;

create unique index if not exists idx_admin_users_employee_no_unique
on public.admin_users(employee_no)
where employee_no is not null and employee_no <> '';
