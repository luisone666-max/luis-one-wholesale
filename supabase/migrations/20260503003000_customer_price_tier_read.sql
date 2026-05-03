drop policy if exists "Public can read active product price tiers" on public.product_price_tiers;
create policy "Public can read active product price tiers"
on public.product_price_tiers
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.customer_products
    where customer_products.id = product_price_tiers.product_id
  )
);

grant select on public.product_price_tiers to anon, authenticated;

notify pgrst, 'reload schema';
