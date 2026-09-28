begin;

-- Platform suspension is not the same thing as a seller choosing to open/close
-- their storefront. Keep is_active as the existing buyer-facing effective flag
-- so every current gateway/RPC continues to fail closed without a broad rewrite.
alter table public.shops
  add column if not exists seller_is_active boolean not null default true,
  add column if not exists platform_suspended boolean not null default false;

-- Before this migration sellers had no separate storefront open/close control;
-- the platform-owner toggle was the only writer of the effective is_active flag.
-- Therefore an existing inactive row is a platform suspension, not seller intent.
-- Preserve that suspension during the forward migration and start seller intent
-- open so only an explicit post-migration seller action can close the storefront.
update public.shops
set seller_is_active = true,
    platform_suspended = not is_active
where seller_is_active is distinct from true
   or platform_suspended is distinct from not is_active;

create or replace function public.protect_shop_managed_fields()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_app_plan text;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      select plan into v_app_plan from public.shop_applications
        where owner_id = (select auth.uid()) and status = 'approved';
      new.plan := coalesce(v_app_plan, 'free_trial');

      if new.platform_suspended then
        raise exception 'platform_suspension_is_platform_managed';
      end if;
    end if;

    -- Legacy callers still submit is_active. Treat that as seller intent.
    new.seller_is_active := coalesce(new.is_active, new.seller_is_active, true);
    new.is_active := new.seller_is_active and not new.platform_suspended;
    return new;
  end if;

  if auth.uid() is not null then
    if new.owner_id is distinct from old.owner_id then
      raise exception 'owner_is_platform_managed';
    end if;

    if new.plan is distinct from old.plan then
      raise exception 'plan_is_platform_managed';
    end if;

    if new.platform_suspended is distinct from old.platform_suspended then
      raise exception 'platform_suspension_is_platform_managed';
    end if;

    -- Backward compatibility for an authenticated seller path that still writes
    -- is_active directly. The new explicit seller_is_active field is also valid,
    -- including while the platform has the storefront suspended.
    if new.is_active is distinct from old.is_active
       and new.seller_is_active is not distinct from old.seller_is_active then
      new.seller_is_active := new.is_active;
    end if;
  else
    -- Preserve compatibility for privileged operational tooling that changes
    -- only is_active; platform suspension tooling should write
    -- platform_suspended explicitly.
    if new.is_active is distinct from old.is_active
       and new.seller_is_active is not distinct from old.seller_is_active
       and new.platform_suspended is not distinct from old.platform_suspended then
      new.seller_is_active := new.is_active;
    end if;
  end if;

  new.is_active := new.seller_is_active and not new.platform_suspended;
  return new;
end;
$$;

-- Replace the legacy FOR ALL policy. Owners retain read/create/update access to
-- their own shop but have no DELETE policy, so a seller cannot cascade away the
-- lifecycle row, orders, entitlements, or ledger and recreate a fresh trial.
drop policy if exists shops_owner_all on public.shops;
drop policy if exists shops_owner_select on public.shops;
drop policy if exists shops_owner_insert on public.shops;
drop policy if exists shops_owner_update on public.shops;
drop policy if exists shops_owner_delete on public.shops;

create policy shops_owner_select on public.shops
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy shops_owner_insert on public.shops
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy shops_owner_update on public.shops
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

commit;
