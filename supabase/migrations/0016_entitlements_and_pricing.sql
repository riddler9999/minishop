-- =============================================================================
-- Mini TikTok Shop — Pricing V1: order entitlements (quota + purchased balance)
--
-- Introduces the `free_trial` tier and a full, auditable entitlement model. FOUR
-- concepts are kept deliberately separate (never collapsed into one
-- "orders_remaining" number, because they expire differently):
--   1. subscription state/cycle  -> shops.plan + shop_entitlements.active/cycle_*
--   2. monthly quota             -> shop_entitlements.monthly_quota/monthly_used
--   3. permanent purchased orders-> shop_entitlements.purchased_balance
--   4. payments + adjustments    -> order_pack_purchases + entitlement_ledger
--
-- A successfully created valid order consumes ONE entitlement IMMEDIATELY inside
-- place_order() (monthly quota first, then purchased balance), atomically and
-- idempotently. Seller-controlled order status never affects billing, and
-- cancellation never auto-refunds. The domain module src/domain/entitlement.ts
-- mirrors this exact math.
--
-- Also (pricing V1 feature decisions):
--   * Township shipping becomes a CORE feature: the Business-only shipping_zones
--     write policies are replaced with owner-scoped ones.
--   * Free trial is capped at 10 products, enforced server-side (11th blocked).
--   * Payment verification is NOT gated here (it never was in the DB).
--
-- Owner-only crediting/activation is done via SECURITY DEFINER RPCs the platform
-- owner calls from the Supabase dashboard (service_role) — matching the manual
-- last-5 payment-verification MVP philosophy (no in-app super-admin surface).
--
-- NON-DESTRUCTIVE to existing data: no shop/product/order row is deleted; a
-- Business->Starter downgrade only changes counters, never data.
-- =============================================================================

begin;

-- ---- 1. free_trial tier on shops + shop_applications ------------------------
alter table public.shops drop constraint if exists shops_plan_check;
alter table public.shops
  add constraint shops_plan_check check (plan in ('free_trial','starter','business'));
-- New shops now default to the free trial (was 'starter'); the actual plan is
-- derived from the seller's platform-approved application in the insert trigger.
alter table public.shops alter column plan set default 'free_trial';

alter table public.shop_applications drop constraint if exists shop_applications_plan_check;
alter table public.shop_applications
  add constraint shop_applications_plan_check check (plan in ('free_trial','starter','business'));
-- A free-trial application carries no payment, so it needs no screenshot.
alter table public.shop_applications alter column screenshot_path drop not null;
alter table public.shop_applications drop constraint if exists shop_applications_proof_required;
alter table public.shop_applications
  add constraint shop_applications_proof_required
    check (plan = 'free_trial' or screenshot_path is not null);

-- ---- 2. shop_entitlements: the live per-shop counters -----------------------
-- One row per shop. Written ONLY by the DB: place_order() consumes, and the
-- owner RPCs grant/credit/adjust. Sellers can read their own row but never write
-- it (no write policy + no write grant).
create table if not exists public.shop_entitlements (
  shop_id           uuid primary key references public.shops(id) on delete cascade,
  plan              text not null check (plan in ('free_trial','starter','business')),
  -- Paid subscription active. Free trial is always active for its own lifetime
  -- quota; a cancelled paid subscription is inactive (nothing may be consumed).
  active            boolean not null default true,
  -- Order cap for the current cycle. For free trial this is a LIFETIME cap.
  monthly_quota     integer not null default 0 check (monthly_quota >= 0),
  -- Orders consumed this cycle (free trial: over the lifetime).
  monthly_used      integer not null default 0 check (monthly_used >= 0),
  -- Permanent Extra Orders remaining. NEVER expires; survives renewal, upgrade,
  -- downgrade and cancellation.
  purchased_balance integer not null default 0 check (purchased_balance >= 0),
  cycle_start       timestamptz,
  cycle_end         timestamptz,
  -- A scheduled downgrade that takes effect at the NEXT renewal (never deletes
  -- Business data — only lowers the cap).
  pending_plan      text check (pending_plan is null or pending_plan in ('free_trial','starter','business')),
  updated_at        timestamptz not null default now()
);
alter table public.shop_entitlements enable row level security;

drop policy if exists shop_entitlements_owner_select on public.shop_entitlements;
create policy shop_entitlements_owner_select on public.shop_entitlements
  for select to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ));
grant select on public.shop_entitlements to authenticated;

-- ---- 3. entitlement_ledger: append-only audit of every entitlement event ----
-- Every grant, consumption, purchase and adjustment is recorded here. The unique
-- index on (shop_id, source_type, source_id) is the IDEMPOTENCY guard: the same
-- order or the same payment can never be applied twice.
create table if not exists public.entitlement_ledger (
  id              bigint generated always as identity primary key,
  shop_id         uuid not null references public.shops(id) on delete cascade,
  event_type      text not null check (event_type in
                    ('init','grant_monthly','consume_order','purchase_extra',
                     'renewal','upgrade','downgrade','cancel','reactivate','adjust')),
  monthly_delta   integer not null default 0,
  purchased_delta integer not null default 0,
  order_id        uuid references public.orders(id) on delete set null,
  source_type     text,   -- 'order' | 'order_pack' | 'application' | 'shop' | 'manual'
  source_id       text,   -- idempotency key within (shop_id, source_type)
  note            text,
  created_at      timestamptz not null default now()
);
create index if not exists entitlement_ledger_shop_idx
  on public.entitlement_ledger (shop_id, created_at desc);
create unique index if not exists entitlement_ledger_source_uniq
  on public.entitlement_ledger (shop_id, source_type, source_id)
  where source_id is not null;
alter table public.entitlement_ledger enable row level security;

drop policy if exists entitlement_ledger_owner_select on public.entitlement_ledger;
create policy entitlement_ledger_owner_select on public.entitlement_ledger
  for select to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ));
grant select on public.entitlement_ledger to authenticated;

-- ---- 4. order_pack_purchases: seller Extra-Orders purchase requests ----------
-- Same manual-payment shape as shop_applications: the seller transfers, uploads
-- a screenshot and submits; the owner credits it via admin_credit_order_pack()
-- from the dashboard. `status` is platform-managed (a seller can only submit a
-- 'pending' request).
create table if not exists public.order_pack_purchases (
  id               uuid primary key default gen_random_uuid(),
  shop_id          uuid not null references public.shops(id) on delete cascade,
  qty              integer not null check (qty in (1,5,10,20,30,50)),
  amount           integer not null check (amount = qty * 500),
  payment_method   text not null check (payment_method in ('kpay','wave','aya')),
  payment_ref_tail text check (payment_ref_tail is null or payment_ref_tail ~ '^[0-9]{5}$'),
  screenshot_path  text not null,
  status           text not null default 'pending'
                     check (status in ('pending','approved','rejected')),
  review_note      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  reviewed_at      timestamptz
);
create index if not exists order_pack_purchases_shop_idx
  on public.order_pack_purchases (shop_id, created_at desc);
alter table public.order_pack_purchases enable row level security;

drop policy if exists order_pack_owner_select on public.order_pack_purchases;
create policy order_pack_owner_select on public.order_pack_purchases
  for select to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists order_pack_owner_insert on public.order_pack_purchases;
create policy order_pack_owner_insert on public.order_pack_purchases
  for insert to authenticated
  with check (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ));
grant select, insert on public.order_pack_purchases to authenticated;

-- Guard: status is platform-managed, and only paid plans may buy Extra Orders.
create or replace function public.protect_order_pack_purchase()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_plan text;
begin
  new.updated_at := now();
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      if new.status <> 'pending' then
        raise exception 'application_status_is_platform_managed';
      end if;
      select plan into v_plan from public.shops
        where id = new.shop_id and owner_id = (select auth.uid());
      if v_plan is distinct from 'starter' and v_plan is distinct from 'business' then
        raise exception 'extra_orders_not_available';
      end if;
    elsif tg_op = 'UPDATE' then
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

drop trigger if exists order_pack_purchases_protect on public.order_pack_purchases;
create trigger order_pack_purchases_protect
  before insert or update on public.order_pack_purchases
  for each row execute function public.protect_order_pack_purchase();

-- ---- 5. orders idempotency key ----------------------------------------------
-- Makes place_order() safe against double-clicks / retries: a repeat call with
-- the same key returns the original order instead of creating (and billing) a
-- second one.
alter table public.orders add column if not exists idempotency_key uuid;
create unique index if not exists orders_shop_idempotency_uniq
  on public.orders (shop_id, idempotency_key)
  where idempotency_key is not null;

-- ---- 6. free-trial product limit (11th product blocked server-side) ---------
create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_plan text;
  v_count integer;
begin
  if auth.uid() is not null then
    select plan into v_plan from public.shops
      where id = new.shop_id and owner_id = (select auth.uid());
    if v_plan = 'free_trial' then
      select count(*) into v_count from public.products where shop_id = new.shop_id;
      if v_count >= 10 then
        raise exception 'product_limit_reached';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_enforce_limit on public.products;
create trigger products_enforce_limit
  before insert on public.products
  for each row execute function public.enforce_product_limit();

-- ---- 7. shops: derive plan from approved application + init entitlement ------
-- Replaces the old INSERT guard (which forced plan='starter'): the plan is now
-- derived from the seller's platform-approved application (free_trial is
-- self-approved), so a seller still can never pick a higher tier directly.
create or replace function public.protect_shop_managed_fields()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_app_plan text;
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      select plan into v_app_plan from public.shop_applications
        where owner_id = (select auth.uid()) and status = 'approved';
      new.plan := coalesce(v_app_plan, 'free_trial');
    end if;
    if tg_op = 'UPDATE' then
      if new.owner_id is distinct from old.owner_id then
        raise exception 'owner_is_platform_managed';
      end if;
      if new.plan is distinct from old.plan then
        raise exception 'plan_is_platform_managed';
      end if;
      if new.logo_url is distinct from old.logo_url and old.plan <> 'business' then
        raise exception 'business_plan_required';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- After a shop is created, initialise its entitlement row from its plan.
create or replace function public.init_shop_entitlement()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_quota integer;
  v_cycle_end timestamptz;
begin
  v_quota := case new.plan when 'business' then 150 when 'starter' then 60 else 20 end;
  v_cycle_end := case when new.plan in ('starter','business') then now() + interval '30 days' else null end;

  insert into public.shop_entitlements
    (shop_id, plan, active, monthly_quota, monthly_used, purchased_balance, cycle_start, cycle_end)
  values (new.id, new.plan, true, v_quota, 0, 0, now(), v_cycle_end)
  on conflict (shop_id) do nothing;

  insert into public.entitlement_ledger
    (shop_id, event_type, monthly_delta, source_type, source_id, note)
  values (new.id, 'init', v_quota, 'shop', new.id::text, 'shop created on plan ' || new.plan)
  on conflict (shop_id, source_type, source_id) where source_id is not null do nothing;

  return new;
end;
$$;

drop trigger if exists shops_init_entitlement on public.shops;
create trigger shops_init_entitlement
  after insert on public.shops
  for each row execute function public.init_shop_entitlement();

-- ---- 8. backfill entitlement rows for shops that predate this migration ------
insert into public.shop_entitlements
  (shop_id, plan, active, monthly_quota, monthly_used, purchased_balance, cycle_start, cycle_end)
select
  s.id, s.plan, true,
  case s.plan when 'business' then 150 when 'starter' then 60 else 20 end,
  0, 0, now(),
  case when s.plan in ('starter','business') then now() + interval '30 days' else null end
from public.shops s
on conflict (shop_id) do nothing;

insert into public.entitlement_ledger
  (shop_id, event_type, monthly_delta, source_type, source_id, note)
select
  s.id, 'init',
  case s.plan when 'business' then 150 when 'starter' then 60 else 20 end,
  'shop', s.id::text, 'backfill: pricing V1 rollout on plan ' || s.plan
from public.shops s
on conflict (shop_id, source_type, source_id) where source_id is not null do nothing;

-- ---- 9. free-trial applications are auto-approved (no payment/review) --------
create or replace function public.protect_shop_application()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  if auth.uid() is not null then
    if new.plan = 'free_trial' then
      -- No payment, no manual review: the free trial is self-approved.
      new.status := 'approved';
      new.reviewed_at := coalesce(new.reviewed_at, now());
    elsif tg_op = 'INSERT' then
      if new.status <> 'pending' then
        raise exception 'application_status_is_platform_managed';
      end if;
    elsif tg_op = 'UPDATE' then
      if new.owner_id is distinct from old.owner_id then
        raise exception 'application_owner_is_immutable';
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

-- ---- 10. township shipping is now core: owner-scoped write policies ----------
drop policy if exists ship_business_insert on public.shipping_zones;
drop policy if exists ship_business_update on public.shipping_zones;
drop policy if exists ship_business_delete on public.shipping_zones;
drop policy if exists ship_owner_insert on public.shipping_zones;
drop policy if exists ship_owner_update on public.shipping_zones;
drop policy if exists ship_owner_delete on public.shipping_zones;
create policy ship_owner_insert on public.shipping_zones
  for insert to authenticated
  with check (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ));
create policy ship_owner_update on public.shipping_zones
  for update to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ));
create policy ship_owner_delete on public.shipping_zones
  for delete to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ));

-- ---- 11. place_order(): consume one entitlement, atomically + idempotently ---
-- Adds p_idempotency_key and the entitlement consumption. Everything runs in one
-- transaction, so a mid-loop stock failure rolls back the consumption too. The
-- entitlement row is locked FOR UPDATE, which serialises concurrent final-slot
-- orders (the loser re-reads the updated counters and is blocked or falls back
-- to the purchased balance).
drop function if exists public.place_order(text,text,text,text,text,text,text,text,jsonb);
create or replace function public.place_order(
  p_shop_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_street text,
  p_region text,
  p_township text,
  p_payment_method text,
  p_payment_ref_tail text,
  p_items jsonb,
  p_idempotency_key uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_shop public.shops%rowtype;
  v_ent public.shop_entitlements%rowtype;
  v_consume text;
  v_existing public.orders%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_unit bigint;
  v_item_total bigint := 0;
  v_delivery bigint := 0;
  v_order_id uuid;
  v_order_no text;
  v_status text;
  v_address text;
  v_product_id uuid;
begin
  perform private.enforce_rate_limit('place_order', 10, interval '5 minutes');

  if p_payment_method not in ('cod','kpay','wave') then
    raise exception 'invalid_payment_method';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 25 then
    raise exception 'invalid_cart';
  end if;
  if coalesce(length(trim(p_customer_name)), 0) not between 1 and 100
     or coalesce(length(trim(p_customer_phone)), 0) not between 6 and 30
     or coalesce(length(p_street), 0) > 300
     or coalesce(length(p_region), 0) > 100
     or coalesce(length(p_township), 0) > 100 then
    raise exception 'invalid_customer';
  end if;
  if p_payment_method <> 'cod'
     and coalesce(trim(p_payment_ref_tail), '') !~ '^[0-9]{5}$' then
    raise exception 'invalid_payment_reference';
  end if;

  select * into v_shop from public.shops
    where slug = p_shop_slug and is_active = true;
  if not found then
    raise exception 'shop_not_found';
  end if;

  -- Idempotency: a repeat submit with the same key returns the original order
  -- (no second order, no second entitlement consumption).
  if p_idempotency_key is not null then
    select * into v_existing from public.orders
      where shop_id = v_shop.id and idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object(
        'order_no', v_existing.order_no,
        'item_total', v_existing.item_total,
        'delivery_fee', v_existing.delivery_fee,
        'grand_total', v_existing.grand_total,
        'payment_method', v_existing.payment_method,
        'amount_now', case when v_existing.payment_method = 'cod' then 0 else v_existing.grand_total end,
        'status', v_existing.status
      );
    end if;
  end if;

  -- Lock the entitlement row (serialises concurrent orders) and decide the
  -- consumption source, mirroring domain/entitlement.ts chooseConsumeSource().
  select * into v_ent from public.shop_entitlements
    where shop_id = v_shop.id for update;
  if not found then
    -- Defensive: a shop with no entitlement row (should not happen post-backfill)
    -- is initialised from its plan before consuming.
    insert into public.shop_entitlements
      (shop_id, plan, active, monthly_quota, monthly_used, purchased_balance, cycle_start, cycle_end)
    values (
      v_shop.id, v_shop.plan, true,
      case v_shop.plan when 'business' then 150 when 'starter' then 60 else 20 end,
      0, 0, now(),
      case when v_shop.plan in ('starter','business') then now() + interval '30 days' else null end
    )
    on conflict (shop_id) do nothing;
    select * into v_ent from public.shop_entitlements
      where shop_id = v_shop.id for update;
  end if;

  if not v_ent.active then
    raise exception 'subscription_inactive';
  end if;
  if v_ent.plan in ('starter','business')
     and (v_ent.cycle_end is null or v_ent.cycle_end <= now()) then
    raise exception 'subscription_inactive';
  end if;
  if v_ent.monthly_used < v_ent.monthly_quota then
    v_consume := 'monthly';
  elsif v_ent.plan in ('starter','business') and v_ent.purchased_balance > 0 then
    v_consume := 'purchased';
  else
    raise exception 'order_quota_exhausted';
  end if;

  if (
    select count(*) from public.orders
    where shop_id = v_shop.id
      and regexp_replace(customer_phone, '[^0-9]', '', 'g')
          = regexp_replace(p_customer_phone, '[^0-9]', '', 'g')
      and created_at >= now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'duplicate_order_limit';
  end if;

  v_delivery := public.resolve_delivery_fee(v_shop.id, p_region, p_township);

  v_order_no := 'ORD-' || to_char(clock_timestamp(), 'YYMMDD') || '-'
                || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_status := case when p_payment_method = 'cod' then 'cod_pending' else 'pending_payment' end;
  v_address := nullif(concat_ws(', ', nullif(trim(p_street),''),
               nullif(trim(p_township),''), nullif(trim(p_region),'')), '');

  -- The pre-insert idempotency SELECT above closes the common (sequential retry)
  -- case; this handles the TRULY concurrent one: two requests with the same key
  -- both saw no existing order, so the loser's insert trips
  -- orders_shop_idempotency_uniq. Catch it and return the winner's order instead
  -- of surfacing a raw unique_violation (still exactly one order, one consume).
  begin
    insert into public.orders (
      shop_id, order_no, customer_name, customer_phone, customer_address,
      region, township, payment_method, payment_ref_tail, status,
      item_total, delivery_fee, grand_total, delivery_service, origin_township, idempotency_key
    ) values (
      v_shop.id, v_order_no, trim(p_customer_name), trim(p_customer_phone), v_address,
      p_region, p_township, p_payment_method,
      case when p_payment_method = 'cod' then null else trim(p_payment_ref_tail) end,
      v_status, 0, v_delivery, 0, v_shop.delivery_service, v_shop.origin_township, p_idempotency_key
    ) returning id into v_order_id;
  exception when unique_violation then
    select * into v_existing from public.orders
      where shop_id = v_shop.id and idempotency_key = p_idempotency_key;
    if not found then raise; end if;  -- a different unique constraint — re-raise
    return jsonb_build_object(
      'order_no', v_existing.order_no,
      'item_total', v_existing.item_total,
      'delivery_fee', v_existing.delivery_fee,
      'grand_total', v_existing.grand_total,
      'payment_method', v_existing.payment_method,
      'amount_now', case when v_existing.payment_method = 'cod' then 0 else v_existing.grand_total end,
      'status', v_existing.status
    );
  end;

  for v_item in select * from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) <> 'object'
       or coalesce(v_item->>'product_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or coalesce(v_item->>'qty','') !~ '^[0-9]{1,3}$' then
      raise exception 'invalid_cart_item';
    end if;

    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::integer;
    if v_qty not between 1 and 100 then
      raise exception 'invalid_quantity';
    end if;

    select * into v_product from public.products
      where id = v_product_id
        and shop_id = v_shop.id
        and status = 'active'
      for update;
    if not found then
      raise exception 'product_unavailable:%', v_product_id;
    end if;
    if v_product.stock < v_qty then
      raise exception 'insufficient_stock:%', v_product_id;
    end if;

    v_unit := case when v_product.is_promotion and v_product.promo_price is not null
                   then v_product.promo_price else v_product.price end;

    update public.products
      set stock = stock - v_qty
      where id = v_product.id;

    insert into public.order_items (order_id, product_id, name, unit_price, qty)
      values (v_order_id, v_product.id, v_product.name, v_unit, v_qty);

    v_item_total := v_item_total + v_unit * v_qty;
  end loop;

  if v_item_total <= 0 then
    raise exception 'empty_cart';
  end if;

  update public.orders
    set item_total = v_item_total,
        grand_total = v_item_total + v_delivery
    where id = v_order_id;

  -- Consume exactly one entitlement for this newly created valid order. Monthly
  -- quota first; only once exhausted is a purchased order used.
  if v_consume = 'monthly' then
    update public.shop_entitlements
      set monthly_used = monthly_used + 1, updated_at = now()
      where shop_id = v_shop.id;
    insert into public.entitlement_ledger
      (shop_id, event_type, monthly_delta, order_id, source_type, source_id, note)
      values (v_shop.id, 'consume_order', 1, v_order_id, 'order', v_order_id::text, v_order_no);
  else
    update public.shop_entitlements
      set purchased_balance = purchased_balance - 1, updated_at = now()
      where shop_id = v_shop.id;
    insert into public.entitlement_ledger
      (shop_id, event_type, purchased_delta, order_id, source_type, source_id, note)
      values (v_shop.id, 'consume_order', -1, v_order_id, 'order', v_order_id::text, v_order_no);
  end if;

  return jsonb_build_object(
    'order_no', v_order_no,
    'item_total', v_item_total,
    'delivery_fee', v_delivery,
    'grand_total', v_item_total + v_delivery,
    'delivery_service', v_shop.delivery_service,
    'payment_method', p_payment_method,
    'amount_now', case when p_payment_method = 'cod' then 0 else v_item_total + v_delivery end,
    'status', v_status
  );
end;
$$;

revoke all on function public.place_order(text,text,text,text,text,text,text,text,jsonb,uuid)
  from public, anon, authenticated;
grant execute on function public.place_order(text,text,text,text,text,text,text,text,jsonb,uuid)
  to anon, authenticated;

-- ---- 12. seller-facing current entitlement snapshot -------------------------
-- security invoker: the caller's RLS on shop_entitlements applies, so a seller
-- reads only their own shop's counters (anon gets nothing).
create or replace function public.current_shop_entitlement()
  returns jsonb
  language sql
  stable
  security invoker
  set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'shop_id',           e.shop_id,
    'plan',              e.plan,
    'active',            e.active,
    'monthly_quota',     e.monthly_quota,
    'monthly_used',      e.monthly_used,
    'purchased_balance', e.purchased_balance,
    'cycle_start',       e.cycle_start,
    'cycle_end',         e.cycle_end,
    'pending_plan',      e.pending_plan
  )
  from public.shop_entitlements e
  join public.shops s on s.id = e.shop_id
  where s.owner_id = (select auth.uid())
  limit 1;
$$;
revoke all on function public.current_shop_entitlement() from public, anon;
grant execute on function public.current_shop_entitlement() to authenticated;

-- ---- 13. owner-only entitlement RPCs (service_role, from the dashboard) ------
-- The platform owner runs these after verifying a transfer screenshot. All are
-- SECURITY DEFINER and revoked from anon/authenticated (only service_role calls
-- them). Every money-in event is idempotent via the ledger source unique index.

-- Activate (or reactivate) a paid subscription: fresh cycle, monthly reset,
-- purchased balance PRESERVED. Used for initial paid onboarding and reactivation.
create or replace function public.admin_activate_subscription(
  p_shop_id uuid, p_plan text, p_payment_ref text default null
) returns void
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_quota integer;
begin
  if p_plan not in ('starter','business') then raise exception 'invalid_plan'; end if;
  if not exists (select 1 from public.shops where id = p_shop_id) then raise exception 'unknown_shop'; end if;
  v_quota := case p_plan when 'business' then 150 else 60 end;

  if p_payment_ref is not null and exists (
    select 1 from public.entitlement_ledger
    where shop_id = p_shop_id and source_type = 'manual' and source_id = p_payment_ref
  ) then
    raise exception 'duplicate_payment';
  end if;

  update public.shops set plan = p_plan where id = p_shop_id;
  insert into public.shop_entitlements
    (shop_id, plan, active, monthly_quota, monthly_used, purchased_balance, cycle_start, cycle_end)
  values (p_shop_id, p_plan, true, v_quota, 0, 0, now(), now() + interval '30 days')
  on conflict (shop_id) do update
    set plan = excluded.plan, active = true, monthly_quota = excluded.monthly_quota,
        monthly_used = 0, cycle_start = now(), cycle_end = now() + interval '30 days',
        pending_plan = null, updated_at = now();

  insert into public.entitlement_ledger
    (shop_id, event_type, monthly_delta, source_type, source_id, note)
  values (p_shop_id, 'grant_monthly', v_quota, 'manual', p_payment_ref,
          'activate ' || p_plan || coalesce(' ref ' || p_payment_ref, ''));
end;
$$;

-- Renew the current plan: fresh monthly quota, purchased PRESERVED. Applies any
-- scheduled downgrade (pending_plan) at this cycle boundary.
create or replace function public.admin_renew_subscription(
  p_shop_id uuid, p_payment_ref text default null
) returns void
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_ent public.shop_entitlements%rowtype; v_plan text; v_quota integer;
begin
  select * into v_ent from public.shop_entitlements where shop_id = p_shop_id for update;
  if not found then raise exception 'unknown_shop'; end if;

  if p_payment_ref is not null and exists (
    select 1 from public.entitlement_ledger
    where shop_id = p_shop_id and source_type = 'manual' and source_id = p_payment_ref
  ) then
    raise exception 'duplicate_payment';
  end if;

  v_plan := coalesce(v_ent.pending_plan, v_ent.plan);
  if v_plan not in ('starter','business') then raise exception 'invalid_plan'; end if;
  v_quota := case v_plan when 'business' then 150 else 60 end;

  update public.shops set plan = v_plan where id = p_shop_id;
  update public.shop_entitlements
    set plan = v_plan, active = true, monthly_quota = v_quota, monthly_used = 0,
        cycle_start = now(), cycle_end = now() + interval '30 days',
        pending_plan = null, updated_at = now()
    where shop_id = p_shop_id;

  insert into public.entitlement_ledger
    (shop_id, event_type, monthly_delta, source_type, source_id, note)
  values (p_shop_id, 'renewal', v_quota, 'manual', p_payment_ref,
          'renew ' || v_plan || coalesce(' ref ' || p_payment_ref, ''));
end;
$$;

-- Mid-cycle upgrade Starter -> Business. Anti-loophole: the orders already
-- consumed this cycle are PRESERVED (monthly_used unchanged); only the cap is
-- raised to 150. The seller pays the price DIFFERENCE for the remaining cycle
-- (see PROJECT.md D56). The cycle end is unchanged.
create or replace function public.admin_upgrade_plan(
  p_shop_id uuid, p_payment_ref text default null
) returns void
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_ent public.shop_entitlements%rowtype;
begin
  select * into v_ent from public.shop_entitlements where shop_id = p_shop_id for update;
  if not found then raise exception 'unknown_shop'; end if;
  if v_ent.plan <> 'starter' then raise exception 'invalid_plan'; end if;

  if p_payment_ref is not null and exists (
    select 1 from public.entitlement_ledger
    where shop_id = p_shop_id and source_type = 'manual' and source_id = p_payment_ref
  ) then
    raise exception 'duplicate_payment';
  end if;

  update public.shops set plan = 'business' where id = p_shop_id;
  update public.shop_entitlements
    set plan = 'business', monthly_quota = 150, active = true, pending_plan = null, updated_at = now()
    where shop_id = p_shop_id;

  insert into public.entitlement_ledger
    (shop_id, event_type, monthly_delta, source_type, source_id, note)
  values (p_shop_id, 'upgrade', 150 - v_ent.monthly_quota, 'manual', p_payment_ref,
          'upgrade starter->business, used ' || v_ent.monthly_used || ' preserved');
end;
$$;

-- Schedule a downgrade for the NEXT renewal. Takes effect at renewal only, and
-- never deletes Business data (only lowers the cap once applied).
create or replace function public.admin_schedule_downgrade(
  p_shop_id uuid, p_target_plan text
) returns void
language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if p_target_plan not in ('free_trial','starter') then raise exception 'invalid_plan'; end if;
  if not exists (select 1 from public.shop_entitlements where shop_id = p_shop_id) then
    raise exception 'unknown_shop';
  end if;
  update public.shop_entitlements
    set pending_plan = p_target_plan, updated_at = now()
    where shop_id = p_shop_id;
  insert into public.entitlement_ledger
    (shop_id, event_type, source_type, note)
  values (p_shop_id, 'downgrade', 'manual', 'scheduled downgrade to ' || p_target_plan || ' at next renewal');
end;
$$;

-- Credit an Extra-Orders pack the seller purchased (permanent balance). Idempotent
-- on the purchase id: crediting the same purchase twice grants nothing.
create or replace function public.admin_credit_order_pack(
  p_purchase_id uuid
) returns void
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_p public.order_pack_purchases%rowtype;
begin
  select * into v_p from public.order_pack_purchases where id = p_purchase_id for update;
  if not found then raise exception 'unknown_shop'; end if;
  if v_p.qty <= 0 then raise exception 'invalid_credit_quantity'; end if;

  -- Credit the balance ONLY when the ledger row is new (the unique index makes a
  -- repeat credit of the same purchase a no-op), so a duplicate call never grants
  -- twice. Marking the purchase 'approved' unconditionally afterwards is safe and
  -- idempotent: on the first (crediting) call it records the outcome; on a repeat
  -- the row is already 'approved' and its balance was granted on that first call.
  with ins as (
    insert into public.entitlement_ledger
      (shop_id, event_type, purchased_delta, source_type, source_id, note)
    values (v_p.shop_id, 'purchase_extra', v_p.qty, 'order_pack', p_purchase_id::text,
            'extra orders pack x' || v_p.qty)
    on conflict (shop_id, source_type, source_id) where source_id is not null do nothing
    returning 1
  )
  update public.shop_entitlements
    set purchased_balance = purchased_balance + v_p.qty, updated_at = now()
    where shop_id = v_p.shop_id and exists (select 1 from ins);

  update public.order_pack_purchases
    set status = 'approved', reviewed_at = now(), updated_at = now()
    where id = p_purchase_id;
end;
$$;

-- Cancel a paid subscription: nothing can be consumed until reactivation, but the
-- purchased balance is retained (it becomes usable again on reactivate).
create or replace function public.admin_cancel_subscription(
  p_shop_id uuid
) returns void
language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if not exists (select 1 from public.shop_entitlements where shop_id = p_shop_id) then
    raise exception 'unknown_shop';
  end if;
  update public.shop_entitlements set active = false, updated_at = now() where shop_id = p_shop_id;
  insert into public.entitlement_ledger (shop_id, event_type, source_type, note)
  values (p_shop_id, 'cancel', 'manual', 'subscription cancelled (purchased balance retained)');
end;
$$;

-- Manual auditable adjustment (support corrections). Never silently overwrites —
-- every change is a ledger row.
create or replace function public.admin_adjust_entitlement(
  p_shop_id uuid, p_monthly_delta integer, p_purchased_delta integer, p_note text default null
) returns void
language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if not exists (select 1 from public.shop_entitlements where shop_id = p_shop_id) then
    raise exception 'unknown_shop';
  end if;
  update public.shop_entitlements
    set monthly_used = greatest(0, monthly_used - coalesce(p_monthly_delta, 0)),
        purchased_balance = greatest(0, purchased_balance + coalesce(p_purchased_delta, 0)),
        updated_at = now()
    where shop_id = p_shop_id;
  insert into public.entitlement_ledger
    (shop_id, event_type, monthly_delta, purchased_delta, source_type, note)
  values (p_shop_id, 'adjust', coalesce(p_monthly_delta,0), coalesce(p_purchased_delta,0), 'manual',
          coalesce(p_note, 'manual adjustment'));
end;
$$;

revoke all on function public.admin_activate_subscription(uuid,text,text) from public, anon, authenticated;
revoke all on function public.admin_renew_subscription(uuid,text) from public, anon, authenticated;
revoke all on function public.admin_upgrade_plan(uuid,text) from public, anon, authenticated;
revoke all on function public.admin_schedule_downgrade(uuid,text) from public, anon, authenticated;
revoke all on function public.admin_credit_order_pack(uuid) from public, anon, authenticated;
revoke all on function public.admin_cancel_subscription(uuid) from public, anon, authenticated;
revoke all on function public.admin_adjust_entitlement(uuid,integer,integer,text) from public, anon, authenticated;
grant execute on function public.admin_activate_subscription(uuid,text,text) to service_role;
grant execute on function public.admin_renew_subscription(uuid,text) to service_role;
grant execute on function public.admin_upgrade_plan(uuid,text) to service_role;
grant execute on function public.admin_schedule_downgrade(uuid,text) to service_role;
grant execute on function public.admin_credit_order_pack(uuid) to service_role;
grant execute on function public.admin_cancel_subscription(uuid) to service_role;
grant execute on function public.admin_adjust_entitlement(uuid,integer,integer,text) to service_role;

commit;
