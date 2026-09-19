-- Backfill of the live migration "optimize_rls_and_fk_index".
-- Adds the missing FK index and uses scalar auth.uid() subqueries so Postgres
-- can evaluate the JWT lookup once per statement rather than once per row.

create index if not exists order_items_product_idx
  on public.order_items(product_id);

drop policy if exists shops_owner_all on public.shops;
create policy shops_owner_all on public.shops
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists products_owner_all on public.products;
create policy products_owner_all on public.products
  for all to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists payacc_owner_all on public.payment_accounts;
create policy payacc_owner_all on public.payment_accounts
  for all to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists ship_owner_all on public.shipping_zones;
create policy ship_owner_all on public.shipping_zones
  for all to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists orders_owner_all on public.orders;
create policy orders_owner_all on public.orders
  for all to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists order_items_owner_all on public.order_items;
create policy order_items_owner_all on public.order_items
  for all to authenticated
  using (exists (
    select 1 from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.id = order_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.id = order_id and s.owner_id = (select auth.uid())
  ));
