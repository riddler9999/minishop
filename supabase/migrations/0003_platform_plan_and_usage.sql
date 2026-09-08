-- =============================================================================
-- Mini TikTok Shop — Platform foundation (Phase 1.5)
-- Plan-based features + monthly billable-order usage tracking + tenant-safe
-- Supabase Storage for shop logos and product images.
--
-- PURELY ADDITIVE. No drops, renames or type changes. Every new column has a
-- NOT NULL DEFAULT, so existing rows and existing writes (place_order()
-- included) keep working with zero code change. place_order(), lookup_order()
-- and all existing RLS policies are intentionally left UNTOUCHED — see
-- supabase/MIGRATION-PLAN-0003.md §0.
-- =============================================================================

-- ---- 1. shop plan (starter | business) --------------------------------------
-- Set by the PLATFORM, not the seller. Default 'starter' backfills every
-- existing shop with no data migration. Nothing is unlocked server-side by the
-- value yet (feature-gating is Phase 2), so no RLS write-restriction is added
-- here; the frontend contract treats plan as read-only for sellers.
alter table public.shops
  add column if not exists plan text not null default 'starter'
    check (plan in ('starter','business'));

-- ---- 2. billable-order flags + generated billability ------------------------
-- Billable (spec): NOT cancelled AND NOT test AND NOT duplicate. Both flags are
-- admin/seller-set and default false, so every existing order is billable
-- unless already cancelled. `is_billable` is the single source of truth for
-- usage counting — change this one expression to change the whole billing rule.
alter table public.orders
  add column if not exists is_test      boolean not null default false,
  add column if not exists is_duplicate boolean not null default false;

alter table public.orders
  add column if not exists is_billable boolean
    generated always as (
      status <> 'cancelled' and is_test = false and is_duplicate = false
    ) stored;

-- Partial index covering the monthly per-shop count of billable orders.
create index if not exists orders_shop_billable_month_idx
  on public.orders (shop_id, created_at)
  where is_billable;

-- ---- 3. per-shop monthly usage view (tenant-safe) ---------------------------
-- security_invoker = on: the CALLER's RLS on orders applies, so an owner sees
-- only their own shop's rows and anon sees nothing. No shop_id filter can be
-- forgotten — isolation is structural.
create or replace view public.shop_monthly_usage
  with (security_invoker = on) as
  select
    o.shop_id,
    date_trunc('month', o.created_at) as month,
    count(*)::int as billable_orders
  from public.orders o
  where o.is_billable
  group by o.shop_id, date_trunc('month', o.created_at);

-- ---- 4. usage tier function -------------------------------------------------
-- Boundaries per spec: 0-100 / 101-500 / 501-1500 / 1501-3000 / 3000+.
create or replace function public.usage_tier(p_count integer)
  returns text
  language sql
  immutable
  set search_path = public
as $$
  select case
    when p_count <= 100  then '0-100'
    when p_count <= 500  then '101-500'
    when p_count <= 1500 then '501-1500'
    when p_count <= 3000 then '1501-3000'
    else '3000+'
  end;
$$;

-- ---- 5. current-month usage RPC for the signed-in seller --------------------
-- security invoker: RLS on shops + orders both apply; a seller can only read
-- their OWN usage. Anon (auth.uid() null) gets no row.
create or replace function public.current_shop_usage()
  returns jsonb
  language sql
  stable
  security invoker
  set search_path = public
as $$
  select jsonb_build_object(
    'shop_id',         s.id,
    'plan',            s.plan,
    'month',           to_char(date_trunc('month', now()), 'YYYY-MM'),
    'billable_orders', coalesce(u.billable_orders, 0),
    'tier',            public.usage_tier(coalesce(u.billable_orders, 0))
  )
  from public.shops s
  left join public.shop_monthly_usage u
    on u.shop_id = s.id and u.month = date_trunc('month', now())
  where s.owner_id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_shop_usage() from public;
grant execute on function public.current_shop_usage() to authenticated;

-- ---- 6. Supabase Storage: tenant-safe logo + product-image buckets ----------
-- Public-read buckets (storefront media). Writes gated by path: the first
-- folder segment MUST be the shop_id of a shop owned by the caller.
--   shop-logos/<shop_id>/logo.<ext>
--   product-images/<shop_id>/<product_id>/<file>.<ext>
insert into storage.buckets (id, name, public)
values ('shop-logos','shop-logos', true),
       ('product-images','product-images', true)
on conflict (id) do nothing;

-- Public read for both buckets (media is shown on the public storefront).
drop policy if exists tenant_media_public_read on storage.objects;
create policy tenant_media_public_read on storage.objects
  for select
  using (bucket_id in ('shop-logos','product-images'));

-- Owner insert — only into their own shop's folder.
drop policy if exists tenant_media_owner_insert on storage.objects;
create policy tenant_media_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('shop-logos','product-images')
    and exists (
      select 1 from public.shops s
      where s.owner_id = auth.uid()
        and s.id::text = (storage.foldername(name))[1]
    )
  );

-- Owner update — only within their own shop's folder (both USING and CHECK).
drop policy if exists tenant_media_owner_update on storage.objects;
create policy tenant_media_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('shop-logos','product-images')
    and exists (
      select 1 from public.shops s
      where s.owner_id = auth.uid()
        and s.id::text = (storage.foldername(name))[1]
    )
  )
  with check (
    bucket_id in ('shop-logos','product-images')
    and exists (
      select 1 from public.shops s
      where s.owner_id = auth.uid()
        and s.id::text = (storage.foldername(name))[1]
    )
  );

-- Owner delete — only within their own shop's folder.
drop policy if exists tenant_media_owner_delete on storage.objects;
create policy tenant_media_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('shop-logos','product-images')
    and exists (
      select 1 from public.shops s
      where s.owner_id = auth.uid()
        and s.id::text = (storage.foldername(name))[1]
    )
  );
