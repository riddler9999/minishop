-- Task 5 / F3: one server-authoritative checkout quote shared by display and order creation.
begin;

create or replace function public.quote_order(
  p_shop_slug text,
  p_region text,
  p_township text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_shop public.shops%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_product_id uuid;
  v_qty integer;
  v_unit bigint;
  v_item_total bigint := 0;
  v_delivery bigint := 0;
begin
  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 25 then
    raise exception 'invalid_cart';
  end if;
  if coalesce(length(p_region), 0) > 100
     or coalesce(length(p_township), 0) > 100
     or coalesce(trim(p_region), '') = ''
     or coalesce(trim(p_township), '') = '' then
    raise exception 'invalid_customer';
  end if;

  select * into v_shop
  from public.shops
  where slug = p_shop_slug and is_active = true
  for share;
  if not found then
    raise exception 'shop_not_found';
  end if;

  -- Hold the authoritative shipping row stable for the duration of this RPC.
  if v_shop.delivery_service = 'ninjavan' then
    if coalesce(trim(v_shop.origin_township), '') = '' then
      raise exception 'ninjavan_origin_missing';
    end if;
    perform 1
    from public.ninjavan_rates
    where is_active = true
      and origin_township = v_shop.origin_township
      and destination_region = p_region
      and destination_township = p_township
    for share;
    if not found then
      raise exception 'ninjavan_route_unavailable';
    end if;
  else
    perform 1
    from public.shipping_zones
    where shop_id = v_shop.id
      and region = p_region
      and township = p_township
    for share;
    -- No custom row is valid: resolve_delivery_fee() intentionally uses
    -- shops.default_delivery_fee as the documented fallback.
  end if;

  v_delivery := public.resolve_delivery_fee(v_shop.id, p_region, p_township);

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

    select * into v_product
    from public.products
    where id = v_product_id
      and shop_id = v_shop.id
      and status = 'active'
    for share;
    if not found then
      raise exception 'product_unavailable:%', v_product_id;
    end if;
    if v_product.stock < v_qty then
      raise exception 'insufficient_stock:%', v_product_id;
    end if;

    v_unit := case when v_product.is_promotion and v_product.promo_price is not null
                   then v_product.promo_price else v_product.price end;
    v_item_total := v_item_total + v_unit * v_qty;
  end loop;

  if v_item_total <= 0 then
    raise exception 'empty_cart';
  end if;

  return jsonb_build_object(
    'item_total', v_item_total,
    'delivery_fee', v_delivery,
    'grand_total', v_item_total + v_delivery,
    'delivery_service', v_shop.delivery_service
  );
end;
$$;

revoke all on function public.quote_order(text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.quote_order(text,text,text,jsonb) to anon, authenticated;

-- Overload the existing atomic place_order contract with accepted quote totals.
-- The quote rows are share-locked before the existing function runs, so a price
-- or route change cannot slip between the stale check and order persistence.
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
  p_expected_item_total bigint,
  p_expected_delivery_fee bigint,
  p_idempotency_key uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_quote jsonb;
begin
  v_quote := public.quote_order(p_shop_slug, p_region, p_township, p_items);

  if p_expected_item_total is null
     or p_expected_delivery_fee is null
     or (v_quote->>'item_total')::bigint <> p_expected_item_total
     or (v_quote->>'delivery_fee')::bigint <> p_expected_delivery_fee then
    raise exception 'quote_stale';
  end if;

  return public.place_order(
    p_shop_slug,
    p_customer_name,
    p_customer_phone,
    p_street,
    p_region,
    p_township,
    p_payment_method,
    p_payment_ref_tail,
    p_items,
    p_idempotency_key
  );
end;
$$;

revoke all on function public.place_order(text,text,text,text,text,text,text,text,jsonb,bigint,bigint,uuid)
  from public, anon, authenticated;
grant execute on function public.place_order(text,text,text,text,text,text,text,text,jsonb,bigint,bigint,uuid)
  to anon, authenticated;

commit;
