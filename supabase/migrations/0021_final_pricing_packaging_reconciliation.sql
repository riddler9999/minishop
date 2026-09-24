-- FINAL pricing + packaging reconciliation (ADR 0002 / PROJECT D60).
-- Historical migrations are intentionally immutable.
-- REVIEW-ONLY until the owner explicitly approves production application.
begin;

-- Existing entitlements adopt the final quota without resetting used orders or purchased balance.
update public.shop_entitlements
set monthly_quota = case plan
  when 'business' then 200
  when 'starter' then 60
  else 20
end,
updated_at = now()
where monthly_quota is distinct from case plan
  when 'business' then 200
  when 'starter' then 60
  else 20
end;

-- New shops initialise with the final quota.
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
  v_quota := case new.plan when 'business' then 200 when 'starter' then 60 else 20 end;
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

-- Activation / renewal / upgrade use Business=200.
create or replace function public.admin_activate_subscription(
  p_shop_id uuid, p_plan text, p_payment_ref text default null
) returns void
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_quota integer;
begin
  if p_plan not in ('starter','business') then raise exception 'invalid_plan'; end if;
  if not exists (select 1 from public.shops where id = p_shop_id) then raise exception 'unknown_shop'; end if;
  v_quota := case p_plan when 'business' then 200 else 60 end;

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
  v_quota := case v_plan when 'business' then 200 else 60 end;

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
    set plan = 'business', monthly_quota = 200, active = true, pending_plan = null, updated_at = now()
    where shop_id = p_shop_id;

  insert into public.entitlement_ledger
    (shop_id, event_type, monthly_delta, source_type, source_id, note)
  values (p_shop_id, 'upgrade', 200 - v_ent.monthly_quota, 'manual', p_payment_ref,
          'upgrade starter->business, used ' || v_ent.monthly_used || ' preserved');
end;
$$;

-- Total-product caps: Active + Draft + Archived rows all count.
create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_plan text;
  v_count integer;
  v_limit integer;
begin
  if auth.uid() is not null then
    select plan into v_plan
    from public.shops
    where id = new.shop_id and owner_id = (select auth.uid());

    v_limit := case v_plan
      when 'business' then 500
      when 'starter' then 100
      else 10
    end;

    select count(*) into v_count
    from public.products
    where shop_id = new.shop_id;

    if v_count >= v_limit then
      raise exception 'product_limit_reached';
    end if;
  end if;
  return new;
end;
$$;

-- Basic promotions are Core; keep RLS and promo-price validity, remove only the old Business gate.
drop trigger if exists products_enforce_plan on public.products;
drop function if exists public.enforce_product_plan();

-- Latest order placement, preserving delivery/idempotency semantics, with Business lazy-init quota=200.
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
      case v_shop.plan when 'business' then 200 when 'starter' then 60 else 20 end,
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

-- Created-order commercial usage: seller cancellation/rejection never reverses usage.
create or replace view public.shop_monthly_usage
with (security_invoker = on) as
select
  o.shop_id,
  date_trunc('month', o.created_at) as month,
  count(*)::int as billable_orders
from public.orders o
where o.is_test = false
  and o.is_duplicate = false
group by o.shop_id, date_trunc('month', o.created_at);

comment on column public.orders.is_billable is
  'Legacy pre-0021 generated flag. Current commercial usage is created-order based via shop_monthly_usage; seller cancellation does not refund entitlement.';

-- Payment-proof auto activation accepts only the final paid prices: 29k / 79k.
create or replace function public.activate_plan_from_verified_payment(
  p_payment_id uuid,
  p_transaction_id text,
  p_amount integer,
  p_receiver_name text,
  p_sender_name text,
  p_paid_at timestamptz,
  p_confidence numeric,
  p_raw_extraction jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_payment public.payment_proofs%rowtype;
  v_plan text;
  v_transaction_id text := nullif(btrim(p_transaction_id), '');
  v_status text;
  v_reason text;
begin
  select * into v_payment
  from public.payment_proofs
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'payment_proof_not_found';
  end if;

  -- Replays of an already-approved proof are idempotent. The entitlement grant
  -- already exists, so never start a fresh subscription cycle on retry.
  if v_payment.status = 'approved' then
    return jsonb_build_object(
      'ok', true,
      'payment_id', v_payment.id,
      'shop_id', v_payment.shop_id,
      'status', v_payment.status,
      'plan', v_payment.detected_plan,
      'amount', v_payment.amount,
      'transaction_id', v_payment.transaction_id,
      'replayed', true
    );
  end if;

  if v_transaction_id is null then
    v_status := 'manual_review';
    v_reason := 'transaction_id_required';
  elsif p_amount not in (29000, 79000) then
    v_status := 'rejected';
    v_reason := 'unsupported_plan_amount';
  elsif lower(regexp_replace(coalesce(p_receiver_name,''), '[^a-zA-Z]', '', 'g'))
        <> lower(regexp_replace('Moe Htet Kyaw', '[^a-zA-Z]', '', 'g')) then
    v_status := 'rejected';
    v_reason := 'receiver_name_mismatch';
  elsif coalesce(p_confidence,0) < 0.92 then
    v_status := 'manual_review';
    v_reason := 'verification_confidence_too_low';
  elsif exists (
    select 1 from public.payment_proofs
    where btrim(transaction_id) = v_transaction_id
      and id <> p_payment_id
  ) then
    v_status := 'rejected';
    v_reason := 'duplicate_transaction_id';
  end if;

  if v_status is not null then
    update public.payment_proofs
    set amount = p_amount,
        transaction_id = v_transaction_id,
        paid_at = p_paid_at,
        sender_name = p_sender_name,
        receiver_name = p_receiver_name,
        status = v_status,
        detected_plan = null,
        confidence = p_confidence,
        rejection_reason = v_reason,
        raw_extraction = coalesce(p_raw_extraction,'{}'::jsonb),
        verified_at = now()
    where id = p_payment_id;

    return jsonb_build_object(
      'ok', false,
      'payment_id', p_payment_id,
      'shop_id', v_payment.shop_id,
      'status', v_status,
      'reason', v_reason
    );
  end if;

  v_plan := case when p_amount = 29000 then 'starter' else 'business' end;

  -- Critical invariant: never update shops.plan alone. 0016 owns subscription
  -- activation and keeps shops.plan + shop_entitlements + ledger in sync.
  perform public.admin_activate_subscription(
    v_payment.shop_id,
    v_plan,
    'payment-proof:' || v_transaction_id
  );

  update public.payment_proofs
  set amount = p_amount,
      transaction_id = v_transaction_id,
      paid_at = p_paid_at,
      sender_name = p_sender_name,
      receiver_name = p_receiver_name,
      status = 'approved',
      detected_plan = v_plan,
      confidence = p_confidence,
      rejection_reason = null,
      raw_extraction = coalesce(p_raw_extraction,'{}'::jsonb),
      verified_at = now()
  where id = p_payment_id;

  return jsonb_build_object(
    'ok', true,
    'payment_id', p_payment_id,
    'shop_id', v_payment.shop_id,
    'status', 'approved',
    'plan', v_plan,
    'amount', p_amount,
    'transaction_id', v_transaction_id
  );
end;
$$;

commit;
