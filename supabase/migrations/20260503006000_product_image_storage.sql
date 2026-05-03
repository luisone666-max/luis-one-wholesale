insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id)
do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Active admins can upload product images" on storage.objects;
create policy "Active admins can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.admin_users
    where admin_users.auth_user_id = auth.uid()
      and admin_users.active = true
  )
);

drop policy if exists "Active admins can update product images" on storage.objects;
create policy "Active admins can update product images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.admin_users
    where admin_users.auth_user_id = auth.uid()
      and admin_users.active = true
  )
)
with check (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.admin_users
    where admin_users.auth_user_id = auth.uid()
      and admin_users.active = true
  )
);

drop policy if exists "Active admins can delete product images" on storage.objects;
create policy "Active admins can delete product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.admin_users
    where admin_users.auth_user_id = auth.uid()
      and admin_users.active = true
  )
);
