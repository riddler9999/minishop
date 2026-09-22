-- Production-safe Ninja Van delivery pricing layered on top of current place_order hardening.

create or replace function public.resolve_delivery_fee(
  p_shop_id uuid,
  p_region text,
  p_township text
) returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_shop public.shops%rowtype;
  v_fee bigint;
begin
  select * into v_shop
  from public.shops
  where id = p_shop_id and is_active = true;

  if not found then
    raise exception 'shop_not_found';
  end if;

  if v_shop.delivery_service = 'ninjavan' then
    if coalesce(trim(v_shop.origin_township),'') = '' then
      raise exception 'ninjavan_origin_missing';
    end if;

    select fee into v_fee
    from public.ninjavan_rates
    where is_active = true
      and origin_township = v_shop.origin_township
      and destination_region = p_region
      and destination_township = p_township
    limit 1;

    if v_fee is null then
      raise exception 'ninjavan_route_unavailable';
    end if;

    return v_fee;
  end if;

  select fee into v_fee
  from public.shipping_zones
  where shop_id = v_shop.id
    and region = p_region
    and township = p_township
  limit 1;

  return coalesce(v_fee, v_shop.default_delivery_fee);
end;
$$;

revoke all on function public.resolve_delivery_fee(uuid,text,text) from public;
grant execute on function public.resolve_delivery_fee(uuid,text,text) to anon, authenticated;

create or replace function public.place_order(
  p_shop_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_street text,
  p_region text,
  p_township text,
  p_payment_method text,
  p_payment_ref_tail text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_shop public.shops%rowtype;
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

  select * into v_shop
  from public.shops
  where slug = p_shop_slug and is_active = true;
  if not found then
    raise exception 'shop_not_found';
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

  insert into public.orders (
    shop_id, order_no, customer_name, customer_phone, customer_address,
    region, township, payment_method, payment_ref_tail, status,
    item_total, delivery_fee, grand_total, delivery_service, origin_township
  ) values (
    v_shop.id, v_order_no, trim(p_customer_name), trim(p_customer_phone), v_address,
    p_region, p_township, p_payment_method,
    case when p_payment_method = 'cod' then null else trim(p_payment_ref_tail) end,
    v_status, 0, v_delivery, 0, v_shop.delivery_service, v_shop.origin_township
  ) returning id into v_order_id;

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

revoke all on function public.place_order(text,text,text,text,text,text,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.place_order(text,text,text,text,text,text,text,text,jsonb)
  to anon, authenticated;
