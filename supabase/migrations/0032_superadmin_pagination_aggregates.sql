-- Task 10: database-side superadmin aggregates.
-- Read only; deployment/application is intentionally outside this task.

create or replace function public.superadmin_platform_metrics()
returns table (
  shops bigint,
  active_shops bigint,
  pending_applications bigint,
  pending_order_packs bigint,
  recorded_revenue numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (select count(*) from public.shops),
    (select count(*) from public.shops where is_active = true),
    (select count(*) from public.shop_applications where status = 'pending'),
    (select count(*) from public.order_pack_purchases where status = 'pending'),
    coalesce((select sum(amount) from public.shop_applications where status = 'approved'), 0)
      + coalesce((select sum(amount) from public.order_pack_purchases where status = 'approved'), 0);
$$;

revoke all on function public.superadmin_platform_metrics() from public;
revoke all on function public.superadmin_platform_metrics() from anon;
revoke all on function public.superadmin_platform_metrics() from authenticated;
grant execute on function public.superadmin_platform_metrics() to service_role;
