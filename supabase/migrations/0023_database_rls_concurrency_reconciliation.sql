-- Database + RLS + concurrency reconciliation discovered during the
-- 2026-09-25 production-readiness audit.
--
-- REVIEW-ONLY. Do not apply to Production from this PR.
--
-- Fixes:
--   1. Public storefront SELECT policies are anon-only so authenticated sellers
--      cannot inherit public policies and see other tenants' public rows.
--   2. Shop-logo Storage writes are Core on every plan while remaining strictly
--      owner + first-folder-segment scoped.
--   3. Extra Order pack approvals require a normalized full transaction id so
--      one underlying payment cannot be credited through multiple purchase rows.
begin;

-- ---- 1. Separate anonymous storefront reads from authenticated tenant reads --
drop policy if exists shops_public_read on public.shops;
create policy shops_public_read on public.shops
  for select to anon
  using (is_active = true);

drop policy if exists payacc_public_read on public.payment_accounts;
create policy payacc_public_read on public.payment_accounts
  for select to anon
  using (
    is_active = true
    and exists (
      select 1 from public.shops s
      where s.id = payment_accounts.shop_id and s.is_active
    )
  );

drop policy if exists ship_public_read on public.shipping_zones;
create policy ship_public_read on public.shipping_zones
  for select to anon
  using (
    exists (
      select 1 from public.shops s
      where s.id = shipping_zones.shop_id and s.is_active
    )
  );

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select to anon
  using (
    status = 'active'
    and exists (
      select 1 from public.shops s
      where s.id = products.shop_id and s.is_active
    )
  );

-- Ninja Van rate rows contain no tenant-owned seller data. Keep them readable
-- by anon + authenticated because seller-side delivery configuration may query
-- the shared published rate table directly.
drop policy if exists ninjavan_rates_public_read on public.ninjavan_rates;
create policy ninjavan_rates_public_read on public.ninjavan_rates
  for select to anon, authenticated
  using (is_active = true);

-- ---- 2. Branding Storage is Core on every plan ------------------------------
drop policy if exists tenant_media_owner_insert on storage.objects;
drop policy if exists tenant_media_owner_update on storage.objects;
drop policy if exists tenant_media_owner_delete on storage.objects;

create policy tenant_media_owner_insert on storage.objects
  for insert to authenticated
  with check (
    (
      bucket_id = 'product-images'
      and exists (
        select 1 from public.shops s
        where s.owner_id = (select auth.uid())
          and s.id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
    or
    (
      bucket_id = 'shop-logos'
      and exists (
        select 1 from public.shops s
        where s.owner_id = (select auth.uid())
          and s.id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
  );

create policy tenant_media_owner_update on storage.objects
  for update to authenticated
  using (
    (
      bucket_id = 'product-images'
      and exists (
        select 1 from public.shops s
        where s.owner_id = (select auth.uid())
          and s.id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
    or
    (
      bucket_id = 'shop-logos'
      and exists (
        select 1 from public.shops s
        where s.owner_id = (select auth.uid())
          and s.id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
  )
  with check (
    (
      bucket_id = 'product-images'
      and exists (
        select 1 from public.shops s
        where s.owner_id = (select auth.uid())
          and s.id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
    or
    (
      bucket_id = 'shop-logos'
      and exists (
        select 1 from public.shops s
        where s.owner_id = (select auth.uid())
          and s.id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
  );

create policy tenant_media_owner_delete on storage.objects
  for delete to authenticated
  using (
    (
      bucket_id = 'product-images'
      and exists (
        select 1 from public.shops s
        where s.owner_id = (select auth.uid())
          and s.id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
    or
    (
      bucket_id = 'shop-logos'
      and exists (
        select 1 from public.shops s
        where s.owner_id = (select auth.uid())
          and s.id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
  );

-- ---- 3. Extra Order pack payment identity ----------------------------------
alter table public.order_pack_purchases
  add column if not exists transaction_id text;

-- Existing rows may be null; only a verified/approved purchase must carry the
-- full transaction id. New duplicate non-empty ids are rejected at the DB layer.
create unique index if not exists order_pack_purchases_transaction_id_uidx
  on public.order_pack_purchases (btrim(transaction_id))
  where transaction_id is not null and btrim(transaction_id) <> '';

alter table public.order_pack_purchases
  drop constraint if exists order_pack_purchases_approved_transaction_required;
alter table public.order_pack_purchases
  add constraint order_pack_purchases_approved_transaction_required
  check (status <> 'approved' or nullif(btrim(transaction_id), '') is not null)
  not valid;

-- Validate separately inside the same reviewed migration. Existing approved rows
-- without full ids will cause deployment to fail closed, requiring reconciliation
-- before the migration can be applied instead of silently weakening the invariant.
alter table public.order_pack_purchases
  validate constraint order_pack_purchases_approved_transaction_required;

create or replace function public.protect_order_pack_purchase()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_plan text;
begin
  new.updated_at := now();

  -- transaction_id is verification output. Sellers may not forge or replace it.
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.transaction_id := null;
      if new.status <> 'pending' then
        raise exception 'application_status_is_platform_managed';
      end if;
      select plan into v_plan
      from public.shops
      where id = new.shop_id and owner_id = (select auth.uid());

      if v_plan is distinct from 'starter'
         and v_plan is distinct from 'business' then
        raise exception 'extra_orders_not_available';
      end if;
    elsif tg_op = 'UPDATE' then
      if new.transaction_id is distinct from old.transaction_id then
        raise exception 'transaction_id_is_platform_managed';
      end if;
      if old.status = 'approved' then
        raise exception 'application_already_approved';
      end if;
      if new.status <> 'pending' then
        raise exception 'application_status_is_platform_managed';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop function if exists public.admin_credit_order_pack(uuid);
create function public.admin_credit_order_pack(
  p_purchase_id uuid,
  p_transaction_id text
) returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_p public.order_pack_purchases%rowtype;
  v_transaction_id text := nullif(btrim(p_transaction_id), '');
begin
  select * into v_p
  from public.order_pack_purchases
  where id = p_purchase_id
  for update;

  if not found then
    raise exception 'unknown_purchase';
  end if;
  if v_p.qty <= 0 then
    raise exception 'invalid_credit_quantity';
  end if;
  if v_transaction_id is null then
    raise exception 'transaction_id_required';
  end if;

  -- Retry of the same already-approved purchase is idempotent only when it
  -- reconciles to the same real transaction.
  if v_p.status = 'approved' then
    if btrim(coalesce(v_p.transaction_id, '')) = v_transaction_id then
      return;
    end if;
    raise exception 'purchase_already_approved';
  end if;

  if exists (
    select 1
    from public.order_pack_purchases other
    where other.id <> p_purchase_id
      and btrim(other.transaction_id) = v_transaction_id
  ) then
    raise exception 'duplicate_transaction_id';
  end if;

  -- Persist payment identity before granting. The unique index is the final
  -- race-safe guard when two different rows attempt the same payment at once.
  update public.order_pack_purchases
  set transaction_id = v_transaction_id,
      updated_at = now()
  where id = p_purchase_id;

  with ins as (
    insert into public.entitlement_ledger
      (shop_id, event_type, purchased_delta, source_type, source_id, note)
    values (
      v_p.shop_id,
      'purchase_extra',
      v_p.qty,
      'order_pack',
      p_purchase_id::text,
      'extra orders pack x' || v_p.qty || ' tx ' || v_transaction_id
    )
    on conflict (shop_id, source_type, source_id)
      where source_id is not null
    do nothing
    returning 1
  )
  update public.shop_entitlements
  set purchased_balance = purchased_balance + v_p.qty,
      updated_at = now()
  where shop_id = v_p.shop_id
    and exists (select 1 from ins);

  update public.order_pack_purchases
  set status = 'approved',
      reviewed_at = now(),
      updated_at = now()
  where id = p_purchase_id;
end;
$$;

revoke all on function public.admin_credit_order_pack(uuid, text)
  from public, anon, authenticated;
grant execute on function public.admin_credit_order_pack(uuid, text)
  to service_role;

commit;
