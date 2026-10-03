-- Task 5-7 security remediation.
-- Forward-only. Prepared for isolated/staging application; do not apply to Production in this task.
begin;
-- Keep buyer projection views intentionally SECURITY DEFINER-style because anonymous storefront callers use narrow public projections.
revoke all on table public.financial_admin_requests from public, anon, authenticated;
revoke all on table public.notification_outbox from public, anon, authenticated;
drop index if exists public.financial_admin_requests_idempotency_key_uidx;
create index if not exists financial_admin_requests_shop_id_idx on public.financial_admin_requests (shop_id);
create index if not exists financial_admin_requests_purchase_id_idx on public.financial_admin_requests (purchase_id) where purchase_id is not null;
revoke all on function public.quote_order(text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.quote_order(text,text,text,jsonb) to anon, authenticated;
revoke all on function public.place_order(text,text,text,text,text,text,text,text,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.place_order(text,text,text,text,text,text,text,text,jsonb,uuid) to anon, authenticated;
revoke all on function public.place_order(text,text,text,text,text,text,text,text,jsonb,bigint,bigint,uuid) from public, anon, authenticated;
grant execute on function public.place_order(text,text,text,text,text,text,text,text,jsonb,bigint,bigint,uuid) to anon, authenticated;
revoke all on function public.adjust_own_product_stock(uuid,integer,text) from public, anon, authenticated;
grant execute on function public.adjust_own_product_stock(uuid,integer,text) to authenticated;
revoke all on function public.update_order_status_and_notify(text,uuid,text) from public, anon, authenticated;
grant execute on function public.update_order_status_and_notify(text,uuid,text) to authenticated;
drop policy if exists inventory_movements_owner_select on public.inventory_movements;
create policy inventory_movements_owner_select on public.inventory_movements for select to authenticated
using (exists (select 1 from public.shops s where s.id = inventory_movements.shop_id and s.owner_id = (select auth.uid())));
commit;
