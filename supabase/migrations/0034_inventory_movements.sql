-- Task 13: auditable inventory movements and explicit cancellation/refund policy boundary.
-- Forward-only. Do not apply to Production from this task.
begin;

create table if not exists public.inventory_movements (
  id bigint generated always as identity primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('order_consume','manual_adjustment','system_adjustment')),
  quantity_delta integer not null check (quantity_delta <> 0),
  stock_before integer not null check (stock_before >= 0),
  stock_after integer not null check (stock_after >= 0),
  source_type text not null check (source_type in ('order','manual','system')),
  source_id text,
  reason text,
  actor_user_id uuid,
  created_at timestamptz not null default now(),
  constraint inventory_movement_math check (stock_after = stock_before + quantity_delta)
);

create index if not exists inventory_movements_shop_created_idx
  on public.inventory_movements (shop_id, created_at desc);
create index if not exists inventory_movements_product_created_idx
  on public.inventory_movements (product_id, created_at desc);
create unique index if not exists inventory_movements_source_uniq
  on public.inventory_movements (product_id, source_type, source_id)
  where source_id is not null;

alter table public.inventory_movements enable row level security;

drop policy if exists inventory_movements_owner_select on public.inventory_movements;
create policy inventory_movements_owner_select on public.inventory_movements
  for select to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = auth.uid()
  ));
grant select on public.inventory_movements to authenticated;

create or replace function public.capture_product_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_delta integer;
  v_order_id uuid;
  v_source_id text;
begin
  if old.stock is not distinct from new.stock then
    return new;
  end if;

  v_delta := new.stock - old.stock;

  -- If this stock decrement belongs to the current place_order transaction,
  -- order_items for the matching product/order already exist by the time the
  -- product row update fires in the established implementation. Capture the
  -- newest matching order as provenance when available; otherwise classify the
  -- mutation as a system adjustment. Seller-authored adjustments use the
  -- dedicated RPC below and set a transaction-local marker.
  if current_setting('minishop.inventory_manual_reason', true) is not null then
    insert into public.inventory_movements(
      shop_id, product_id, movement_type, quantity_delta,
      stock_before, stock_after, source_type, source_id, reason, actor_user_id
    ) values (
      new.shop_id, new.id, 'manual_adjustment', v_delta,
      old.stock, new.stock, 'manual',
      current_setting('minishop.inventory_manual_source', true),
      current_setting('minishop.inventory_manual_reason', true),
      auth.uid()
    );
    return new;
  end if;

  if v_delta < 0 and nullif(current_setting('minishop.inventory_order_id', true), '') is not null then
    v_order_id := current_setting('minishop.inventory_order_id', true)::uuid;
    v_source_id := v_order_id::text || ':' || new.id::text;

    insert into public.inventory_movements(
      shop_id, product_id, movement_type, quantity_delta,
      stock_before, stock_after, source_type, source_id, reason
    ) values (
      new.shop_id, new.id, 'order_consume', v_delta,
      old.stock, new.stock, 'order', v_source_id, 'order stock consumption'
    )
    on conflict (product_id, source_type, source_id)
      where source_id is not null
    do nothing;
    return new;
  end if;

  insert into public.inventory_movements(
    shop_id, product_id, movement_type, quantity_delta,
    stock_before, stock_after, source_type, reason
  ) values (
    new.shop_id, new.id, 'system_adjustment', v_delta,
    old.stock, new.stock, 'system', 'unclassified product stock mutation'
  );
  return new;
end;
$fn$;

drop trigger if exists products_inventory_movement_audit on public.products;
create trigger products_inventory_movement_audit
after update of stock on public.products
for each row execute function public.capture_product_stock_movement();

create or replace function public.adjust_own_product_stock(
  p_product_id uuid,
  p_quantity_delta integer,
  p_reason text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_product public.products%rowtype;
  v_reason text := nullif(btrim(p_reason), '');
  v_source text := gen_random_uuid()::text;
begin
  if p_quantity_delta is null or p_quantity_delta = 0 then
    raise exception 'inventory_adjustment_delta_required';
  end if;
  if v_reason is null then
    raise exception 'inventory_adjustment_reason_required';
  end if;
  if length(v_reason) > 300 then
    raise exception 'inventory_adjustment_reason_too_long';
  end if;

  select p.* into v_product
  from public.products p
  join public.shops s on s.id = p.shop_id
  where p.id = p_product_id
    and s.owner_id = auth.uid()
  for update;

  if not found then
    raise exception 'inventory_product_not_found';
  end if;
  if v_product.stock + p_quantity_delta < 0 then
    raise exception 'inventory_adjustment_would_go_negative';
  end if;

  perform set_config('minishop.inventory_manual_reason', v_reason, true);
  perform set_config('minishop.inventory_manual_source', v_source, true);

  update public.products
  set stock = stock + p_quantity_delta
  where id = p_product_id;

  return jsonb_build_object(
    'product_id', p_product_id,
    'stock_before', v_product.stock,
    'stock_after', v_product.stock + p_quantity_delta,
    'quantity_delta', p_quantity_delta
  );
end;
$fn$;

revoke all on function public.adjust_own_product_stock(uuid,integer,text)
  from public, anon;
grant execute on function public.adjust_own_product_stock(uuid,integer,text)
  to authenticated;

-- Current pilot policy boundary:
-- cancellation_does_not_auto_restock
-- refund_restock_requires_manual_policy_decision
-- Order entitlement is consumed at successful order creation and is not restored
-- by reject/cancel/no-show/RTO/later-refund per CONTEXT.md / ADR 0002.
-- Until an explicit restock rule is approved, order status transitions MUST NOT
-- mutate product stock automatically. Any physical restock is a deliberate,
-- reasoned seller stock adjustment recorded above.

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
as $
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
  perform set_config('minishop.inventory_order_id', '', true);
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
     and coalesce(trim(p_payment_ref_tail), '') !~ '^[0-9]{5} then
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
       or coalesce(v_item->>'product_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}
       or coalesce(v_item->>'qty','') !~ '^[0-9]{1,3} then
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

    perform set_config('minishop.inventory_order_id', v_order_id::text, true);
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
$;

commit;
