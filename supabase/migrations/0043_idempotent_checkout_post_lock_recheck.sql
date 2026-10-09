-- The first request can exhaust the final quota slot while a same-key retry
-- waits on the entitlement row lock. Recheck committed orders after acquiring
-- that lock so retries return the original order instead of quota_exhausted.
-- Preserve the full checkout RPC signature and existing security boundary.
begin;

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
  v_variant public.product_variants%rowtype;
  v_qty integer;
  v_unit bigint;
  v_item_total bigint := 0;
  v_delivery bigint := 0;
  v_order_id uuid;
  v_order_no text;
  v_status text;
  v_address text;
  v_product_id uuid;
  v_variant_id uuid;
  v_has_variants boolean;
  v_request_fingerprint text;
begin
  perform private.enforce_rate_limit('place_order', 10, interval '5 minutes');
  if p_idempotency_key is null then raise exception 'idempotency_key_required'; end if;
  if p_payment_method not in ('cod','kpay','wave') then raise exception 'invalid_payment_method'; end if;
  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 25 then raise exception 'invalid_cart'; end if;
  if coalesce(length(trim(p_customer_name)), 0) not between 1 and 100
     or coalesce(length(trim(p_customer_phone)), 0) not between 6 and 30
     or coalesce(length(p_street), 0) > 300
     or coalesce(length(p_region), 0) > 100
     or coalesce(length(p_township), 0) > 100 then raise exception 'invalid_customer'; end if;
  if p_payment_method <> 'cod' and coalesce(trim(p_payment_ref_tail), '') !~ '^[0-9]{5}$' then
    raise exception 'invalid_payment_reference';
  end if;

  select * into v_shop from public.shops where slug = p_shop_slug and is_active = true;
  if not found then raise exception 'shop_not_found'; end if;
  v_request_fingerprint := private.checkout_request_fingerprint(
    p_customer_name, p_customer_phone, p_street, p_region, p_township,
    p_payment_method, p_payment_ref_tail, p_items
  );
  select * into v_existing from public.orders
  where shop_id = v_shop.id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.checkout_request_fingerprint is distinct from v_request_fingerprint then
      raise exception 'idempotency_key_conflict';
    end if;
    return jsonb_build_object(
      'order_no', v_existing.order_no, 'item_total', v_existing.item_total,
      'delivery_fee', v_existing.delivery_fee, 'grand_total', v_existing.grand_total,
      'payment_method', v_existing.payment_method,
      'amount_now', case when v_existing.payment_method = 'cod' then 0 else v_existing.grand_total end,
      'status', v_existing.status
    );
  end if;

  select * into v_ent from public.shop_entitlements where shop_id = v_shop.id for update;
  if not found then
    insert into public.shop_entitlements
      (shop_id, plan, active, monthly_quota, monthly_used, purchased_balance, cycle_start, cycle_end)
    values (
      v_shop.id, v_shop.plan, true,
      case v_shop.plan when 'business' then 200 when 'starter' then 60 else 20 end,
      0, 0, now(),
      case when v_shop.plan in ('starter','business') then now() + interval '30 days' else null end
    ) on conflict (shop_id) do nothing;
    select * into v_ent from public.shop_entitlements where shop_id = v_shop.id for update;
  end if;
  -- Another transaction may have committed this idempotency key while we
  -- waited for the shop entitlement lock. Return the existing order before
  -- evaluating quota, inventory, or other non-idempotent limits.
  select * into v_existing from public.orders
  where shop_id = v_shop.id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.checkout_request_fingerprint is distinct from v_request_fingerprint then
      raise exception 'idempotency_key_conflict';
    end if;
    return jsonb_build_object(
      'order_no', v_existing.order_no, 'item_total', v_existing.item_total,
      'delivery_fee', v_existing.delivery_fee, 'grand_total', v_existing.grand_total,
      'payment_method', v_existing.payment_method,
      'amount_now', case when v_existing.payment_method = 'cod' then 0 else v_existing.grand_total end,
      'status', v_existing.status
    );
  end if;

  if not v_ent.active then raise exception 'subscription_inactive'; end if;
  if v_ent.plan in ('starter','business') and (v_ent.cycle_end is null or v_ent.cycle_end <= now()) then
    raise exception 'subscription_inactive';
  end if;
  if v_ent.monthly_used < v_ent.monthly_quota then v_consume := 'monthly';
  elsif v_ent.plan in ('starter','business') and v_ent.purchased_balance > 0 then v_consume := 'purchased';
  else raise exception 'order_quota_exhausted'; end if;

  if (select count(*) from public.orders
      where shop_id = v_shop.id
        and regexp_replace(customer_phone, '[^0-9]', '', 'g') = regexp_replace(p_customer_phone, '[^0-9]', '', 'g')
        and created_at >= now() - interval '10 minutes') >= 5 then
    raise exception 'duplicate_order_limit';
  end if;

  v_delivery := public.resolve_delivery_fee(v_shop.id, p_region, p_township);
  v_order_no := 'ORD-' || to_char(clock_timestamp(), 'YYMMDD') || '-'
                || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_status := case when p_payment_method = 'cod' then 'cod_pending' else 'pending_payment' end;
  v_address := nullif(concat_ws(', ', nullif(trim(p_street),''), nullif(trim(p_township),''), nullif(trim(p_region),'')), '');

  begin
    insert into public.orders (
      shop_id, order_no, customer_name, customer_phone, customer_address,
      region, township, payment_method, payment_ref_tail, status,
      item_total, delivery_fee, grand_total, delivery_service, origin_township,
      idempotency_key, checkout_request_fingerprint
    ) values (
      v_shop.id, v_order_no, trim(p_customer_name), trim(p_customer_phone), v_address,
      p_region, p_township, p_payment_method,
      case when p_payment_method = 'cod' then null else trim(p_payment_ref_tail) end,
      v_status, 0, v_delivery, 0, v_shop.delivery_service, v_shop.origin_township,
      p_idempotency_key, v_request_fingerprint
    ) returning id into v_order_id;
  exception when unique_violation then
    select * into v_existing from public.orders
    where shop_id = v_shop.id and idempotency_key = p_idempotency_key;
    if not found then raise; end if;
    if v_existing.checkout_request_fingerprint is distinct from v_request_fingerprint then
      raise exception 'idempotency_key_conflict';
    end if;
    return jsonb_build_object(
      'order_no', v_existing.order_no, 'item_total', v_existing.item_total,
      'delivery_fee', v_existing.delivery_fee, 'grand_total', v_existing.grand_total,
      'payment_method', v_existing.payment_method,
      'amount_now', case when v_existing.payment_method = 'cod' then 0 else v_existing.grand_total end,
      'status', v_existing.status
    );
  end;

  for v_item in select * from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) <> 'object'
       or coalesce(v_item->>'product_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or coalesce(v_item->>'qty','') !~ '^[0-9]{1,3}$'
       or (v_item->>'variant_id' is not null and v_item->>'variant_id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$') then
      raise exception 'invalid_cart_item';
    end if;
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_qty := (v_item->>'qty')::integer;
    if v_qty not between 1 and 100 then raise exception 'invalid_quantity'; end if;

    select * into v_product from public.products
    where id = v_product_id and shop_id = v_shop.id and status = 'active' for update;
    if not found then raise exception 'product_unavailable:%', v_product_id; end if;
    select exists(select 1 from public.product_variants where product_id = v_product.id and status = 'active')
      into v_has_variants;

    if v_has_variants then
      if v_variant_id is null then raise exception 'variant_required:%', v_product_id; end if;
      select * into v_variant from public.product_variants
      where id = v_variant_id and product_id = v_product.id
        and shop_id = v_shop.id and status = 'active' for update;
      if not found then raise exception 'variant_unavailable:%', v_variant_id; end if;
      if v_variant.stock < v_qty then raise exception 'insufficient_stock:%', v_variant_id; end if;
      v_unit := coalesce(
        case when v_product.is_promotion then v_variant.promo_price end,
        case when v_variant.price is null and v_product.is_promotion then v_product.promo_price end,
        v_variant.price, v_product.price
      );
      update public.product_variants set stock = stock - v_qty where id = v_variant.id;
      insert into public.order_items (
        order_id, product_id, variant_id, name, variant_name, variant_sku, unit_price, qty
      ) values (
        v_order_id, v_product.id, v_variant.id, v_product.name, v_variant.name, v_variant.sku, v_unit, v_qty
      );
    else
      if v_variant_id is not null then raise exception 'variant_unavailable:%', v_variant_id; end if;
      if v_product.stock < v_qty then raise exception 'insufficient_stock:%', v_product_id; end if;
      v_unit := case when v_product.is_promotion and v_product.promo_price is not null
                     then v_product.promo_price else v_product.price end;
      update public.products set stock = stock - v_qty where id = v_product.id;
      insert into public.order_items (order_id, product_id, name, unit_price, qty)
      values (v_order_id, v_product.id, v_product.name, v_unit, v_qty);
    end if;
    v_item_total := v_item_total + v_unit * v_qty;
  end loop;

  if v_item_total <= 0 then raise exception 'empty_cart'; end if;
  update public.orders set item_total = v_item_total, grand_total = v_item_total + v_delivery where id = v_order_id;

  if v_consume = 'monthly' then
    update public.shop_entitlements set monthly_used = monthly_used + 1, updated_at = now() where shop_id = v_shop.id;
    insert into public.entitlement_ledger
      (shop_id, event_type, monthly_delta, order_id, source_type, source_id, note)
    values (v_shop.id, 'consume_order', 1, v_order_id, 'order', v_order_id::text, v_order_no);
  else
    update public.shop_entitlements set purchased_balance = purchased_balance - 1, updated_at = now() where shop_id = v_shop.id;
    insert into public.entitlement_ledger
      (shop_id, event_type, purchased_delta, order_id, source_type, source_id, note)
    values (v_shop.id, 'consume_order', -1, v_order_id, 'order', v_order_id::text, v_order_no);
  end if;

  return jsonb_build_object(
    'order_no', v_order_no, 'item_total', v_item_total,
    'delivery_fee', v_delivery, 'grand_total', v_item_total + v_delivery,
    'delivery_service', v_shop.delivery_service, 'payment_method', p_payment_method,
    'amount_now', case when p_payment_method = 'cod' then 0 else v_item_total + v_delivery end,
    'status', v_status
  );
end;
$$;

commit;
