# Admin setup

Admin access uses Supabase Auth plus the `public.admin_users` table.

## 1. Register the admin auth user

Create an auth user in Supabase:

1. Open Supabase Dashboard.
2. Go to Authentication > Users.
3. Add or invite the admin email, or register with the app using email/password.

## 2. Find the auth user id

In Supabase Dashboard:

1. Go to Authentication > Users.
2. Open the admin user.
3. Copy the user `id`.

## 3. Insert the admin profile

Run this in Supabase SQL Editor, replacing the values:

```sql
insert into public.admin_users (auth_user_id, email, name, role, active)
values (
  'PASTE_AUTH_USER_ID_HERE',
  'admin@example.com',
  'Admin Name',
  'owner',
  true
)
on conflict (auth_user_id)
do update set
  email = excluded.email,
  name = excluded.name,
  role = excluded.role,
  active = true,
  updated_at = now();
```

Allowed roles are:

- `owner`: full access, owner center, reports, staff, products, categories, online orders, POS, cashier, and cash drawer.
- `admin`: store management access without being the highest owner.
- `staff`: limited staff access.
- `sales`: sales desk and product price lookup.
- `cashier`: cashier center and cash drawer.
- `warehouse`: order/product handling role for future warehouse workflows.

## 4. Deactivate an admin

Run:

```sql
update public.admin_users
set active = false, updated_at = now()
where email = 'admin@example.com';
```

Inactive admins and normal customer accounts cannot access `/admin` or `/api/admin/*`.

## Notes

- Never put `SUPABASE_SERVICE_ROLE_KEY` in browser code.
- Admin APIs verify the httpOnly admin session cookie on the server.
- A customer account is not an admin unless its auth user id exists in `public.admin_users` and `active = true`.
