-- Production Ninja Van Myanmar rate bands transcribed from supplied coverage charts.
-- The charts group destination townships into fee bands for each sender origin.
-- Exact township membership remains represented by the chart; do not silently fall back
-- when a route is not present in ninjavan_rates.

create or replace function public.resolve_delivery_fee(
  p_shop_id uuid,
  p_region text,
  p_township text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop public.shops%rowtype;
  v_fee bigint;
begin
  select * into v_shop from public.shops where id = p_shop_id and is_active = true;
  if not found then raise exception 'shop_not_found'; end if;

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

  select fee into v_fee from public.shipping_zones
    where shop_id = v_shop.id and region = p_region and township = p_township
    limit 1;
  return coalesce(v_fee, v_shop.default_delivery_fee);
end;
$$;

revoke all on function public.resolve_delivery_fee(uuid,text,text) from public;
grant execute on function public.resolve_delivery_fee(uuid,text,text) to anon, authenticated;

-- Snapshot the selected carrier/origin on every new order.
-- place_order is replaced here so delivery pricing is authoritative in the DB.
create or replace function public.place_order(
  p_shop_slug text, p_customer_name text, p_customer_phone text, p_street text,
  p_region text, p_township text, p_payment_method text, p_payment_ref_tail text,
  p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_shop public.shops%rowtype; v_item jsonb; v_product public.products%rowtype;
  v_qty integer; v_unit bigint; v_item_total bigint := 0; v_delivery bigint;
  v_order_id uuid; v_order_no text; v_status text; v_address text;
begin
  if p_payment_method not in ('cod','kpay','wave') then raise exception 'invalid_payment_method'; end if;
  if p_items is null or jsonb_array_length(p_items)=0 then raise exception 'empty_cart'; end if;
  if coalesce(trim(p_customer_name),'')='' or coalesce(trim(p_customer_phone),'')='' then raise exception 'missing_customer'; end if;

  select * into v_shop from public.shops where slug=p_shop_slug and is_active=true;
  if not found then raise exception 'shop_not_found'; end if;
  v_delivery := public.resolve_delivery_fee(v_shop.id,p_region,p_township);

  for i in 1..5 loop
    v_order_no := 'ORD-' || upper(right(to_char(clock_timestamp(),'YYMMDD') ||
      to_hex((extract(epoch from clock_timestamp())*1000)::bigint),6));
    exit when not exists(select 1 from public.orders where shop_id=v_shop.id and order_no=v_order_no);
    v_order_no := null;
  end loop;
  if v_order_no is null then raise exception 'order_no_generation_failed'; end if;

  v_status := case when p_payment_method='cod' then 'cod_pending' else 'pending_payment' end;
  v_address := nullif(concat_ws(', ',nullif(trim(p_street),''),nullif(trim(p_township),''),nullif(trim(p_region),'')),'');
  insert into public.orders(shop_id,order_no,customer_name,customer_phone,customer_address,
    region,township,payment_method,payment_ref_tail,status,item_total,delivery_fee,grand_total,
    delivery_service,origin_township)
  values(v_shop.id,v_order_no,trim(p_customer_name),trim(p_customer_phone),v_address,p_region,p_township,
    p_payment_method,nullif(trim(p_payment_ref_tail),''),v_status,0,v_delivery,0,
    v_shop.delivery_service,v_shop.origin_township)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(coalesce((v_item->>'qty')::int,0),0);
    if v_qty=0 then continue; end if;
    select * into v_product from public.products where id=(v_item->>'product_id')::uuid
      and shop_id=v_shop.id and status='active';
    if not found then raise exception 'product_unavailable:%',(v_item->>'product_id'); end if;
    v_unit := case when v_product.is_promotion and v_product.promo_price is not null
      then v_product.promo_price else v_product.price end;
    insert into public.order_items(order_id,product_id,name,unit_price,qty)
      values(v_order_id,v_product.id,v_product.name,v_unit,v_qty);
    v_item_total := v_item_total + v_unit*v_qty;
  end loop;
  if v_item_total=0 then raise exception 'empty_cart'; end if;
  update public.orders set item_total=v_item_total,grand_total=v_item_total+v_delivery where id=v_order_id;
  return jsonb_build_object('order_no',v_order_no,'item_total',v_item_total,'delivery_fee',v_delivery,
    'grand_total',v_item_total+v_delivery,'delivery_service',v_shop.delivery_service,
    'payment_method',p_payment_method,'amount_now',case when p_payment_method='cod' then 0 else v_item_total+v_delivery end,
    'status',v_status);
end;
$$;

revoke all on function public.place_order(text,text,text,text,text,text,text,text,jsonb) from public;
grant execute on function public.place_order(text,text,text,text,text,text,text,text,jsonb) to anon, authenticated;
