# Production Deployment

## Required Vercel Environment Variables

Add these variables in Vercel Project Settings > Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_MESSENGER_URL=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_PRODUCT_SHARE_URL=
NEXT_PUBLIC_META_PIXEL_ID=
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe for browser use when Row Level Security policies are enabled. `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed in client components, browser code, logs, screenshots, or GitHub.

## Required Supabase Migrations

Run every SQL file in `supabase/migrations` against the production Supabase project, in filename order. Current important migrations include:

- `20260503000000_initial_schema.sql`
- `20260503001000_customer_auth_rls.sql`
- `20260503002000_cart_items.sql`
- `20260503003000_customer_price_tier_read.sql`
- `20260503004000_allow_single_piece_orders.sql`
- `20260503005000_admin_users.sql`
- `20260503006000_product_image_storage.sql`

Use either Supabase CLI `supabase db push` after linking the project, or paste each migration into Supabase SQL Editor and run it in order.

## Required Supabase Storage

The product image upload feature uses the public bucket:

- `product-images`

The migration `20260503006000_product_image_storage.sql` creates the bucket and storage policies. Product images are publicly readable. Upload, update, and delete operations are limited to active admin users.

## Create The First Admin User

1. Register or create a Supabase Auth user for the admin email.
2. In Supabase Dashboard, open Authentication > Users.
3. Copy the Auth user ID.
4. Open SQL Editor and insert the admin row:

```sql
insert into public.admin_users (auth_user_id, email, name, role, active)
values ('AUTH_USER_ID_HERE', 'admin@example.com', 'Admin Name', 'owner', true);
```

To deactivate an admin:

```sql
update public.admin_users
set active = false
where email = 'admin@example.com';
```

## Deploy To Vercel

1. Push the repository to GitHub.
2. Create a new Vercel project from the repository.
3. Set the environment variables listed above.
4. Confirm the Supabase migrations have been applied.
5. Deploy.
6. After deploy, test:
   - Customer product listing and product detail.
   - Customer register/login.
   - Cart and checkout flow.
   - `/admin/login`.
   - Admin products, categories, orders, and product image upload.

## Connect A Custom Domain

1. In Vercel, open Project Settings > Domains.
2. Add the domain.
3. Follow Vercel's DNS instructions.
4. After DNS verifies, set `NEXT_PUBLIC_SITE_URL` to the production domain.
5. Redeploy if the site URL is used in customer-facing links.

## Facebook Page Button

Set `NEXT_PUBLIC_MESSENGER_URL` to the Messenger link for the store, for example:

```env
NEXT_PUBLIC_MESSENGER_URL=https://m.me/your-page-name
```

Keep the value public-friendly. Do not put private tokens in this variable.

To connect the Facebook Page `Shop Now` button:

1. Open the store Facebook Page settings.
2. Edit the page action button.
3. Choose `Shop Now` or a similar shopping/contact action.
4. Set the destination URL to the production website home page or product listing page, for example `https://your-domain.com/category/all`.
5. Use the Messenger button separately for chat support by linking it to the same Messenger URL configured in `NEXT_PUBLIC_MESSENGER_URL`.

## Production Safety Notes

- `/dev/supabase-test` is development-only and requires active admin access.
- `/admin` pages and `/api/admin/*` routes are protected by `src/proxy.ts`.
- Supplier notes, internal cost notes, and admin notes are admin-only and must not be returned by customer-facing queries.
- Keep `.env.local` local only. It is ignored by Git.
