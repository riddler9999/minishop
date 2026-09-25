
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.api_rate_limits (
  id bigint generated always as identity primary key,
  request_key text not null,
  action text not null,
  requested_at timestamptz not null default now()
);
create index if not exists api_rate_limits_lookup_idx
  on private.api_rate_limits (request_key, action, requested_at desc);

create or replace function private.enforce_rate_limit(
  p_action text,
  p_limit integer,
  p_window interval
) returns void
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare
  v_headers jsonb;
  v_raw_key text;
  v_key text;
  v_count integer;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;

  v_raw_key := coalesce(
    split_part(v_headers->>'x-forwarded-for', ',', 1),
    v_headers->>'cf-connecting-ip',
    v_headers->>'user-agent',
    'unknown'
  );
  v_key := md5(coalesce(v_raw_key, 'unknown'));

  perform pg_advisory_xact_lock(hashtextextended(p_action || ':' || v_key, 0));

  delete from private.api_rate_limits
    where requested_at < now() - interval '1 day';

  select count(*) into v_count
  from private.api_rate_limits
  where request_key = v_key
    and action = p_action
    and requested_at >= now() - p_window;

  if v_count >= p_limit then
    raise exception 'rate_limit_exceeded';
  end if;

  insert into private.api_rate_limits (request_key, action)
  values (v_key, p_action);
end;
$$;
revoke all on function private.enforce_rate_limit(text, integer, interval) from public, anon, authenticated;

create or replace function public.protect_shop_managed_fields()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' and new.plan <> 'starter' then
      raise exception 'plan_is_platform_managed';
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

drop trigger if exists shops_protect_managed_fields on public.shops;
create trigger shops_protect_managed_fields
before insert or update on public.shops
for each row execute function public.protect_shop_managed_fields();

create or replace function public.enforce_product_plan()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_plan text;
begin
  if auth.uid() is not null and new.is_promotion then
    select plan into v_plan from public.shops
      where id = new.shop_id and owner_id = (select auth.uid());
    if v_plan is distinct from 'business' then
      raise exception 'business_plan_required';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_enforce_plan on public.products;
create trigger products_enforce_plan
before insert or update on public.products
for each row execute function public.enforce_product_plan();

create or replace function public.protect_order_billing_fields()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is not null then
    if new.is_test is distinct from old.is_test
       or new.is_duplicate is distinct from old.is_duplicate then
      raise exception 'billing_fields_are_platform_managed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_protect_billing_fields on public.orders;
create trigger orders_protect_billing_fields
before update on public.orders
for each row execute function public.protect_order_billing_fields();

drop policy if exists orders_owner_all on public.orders;
drop policy if exists orders_owner_select on public.orders;
drop policy if exists orders_owner_update on public.orders;
create policy orders_owner_select on public.orders
  for select to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ));
create policy orders_owner_update on public.orders
  for update to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists order_items_owner_all on public.order_items;
drop policy if exists order_items_owner_select on public.order_items;
create policy order_items_owner_select on public.order_items
  for select to authenticated
  using (exists (
    select 1
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.id = order_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists ship_owner_all on public.shipping_zones;
drop policy if exists ship_owner_select on public.shipping_zones;
drop policy if exists ship_business_insert on public.shipping_zones;
drop policy if exists ship_business_update on public.shipping_zones;
drop policy if exists ship_business_delete on public.shipping_zones;
create policy ship_owner_select on public.shipping_zones
  for select to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid())
  ));
create policy ship_business_insert on public.shipping_zones
  for insert to authenticated
  with check (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid()) and s.plan = 'business'
  ));
create policy ship_business_update on public.shipping_zones
  for update to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid()) and s.plan = 'business'
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid()) and s.plan = 'business'
  ));
create policy ship_business_delete on public.shipping_zones
  for delete to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = (select auth.uid()) and s.plan = 'business'
  ));

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
          and s.id::text = (storage.foldername(name))[1]
      )
    )
    or
    (
      bucket_id = 'shop-logos'
      and exists (
        select 1 from public.shops s
        where s.owner_id = (select auth.uid())
          and s.plan = 'business'
          and s.id::text = (storage.foldername(name))[1]
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
          and s.id::text = (storage.foldername(name))[1]
      )
    )
    or
    (
      bucket_id = 'shop-logos'
      and exists (
        select 1 from public.shops s
        where s.owner_id = (select auth.uid())
          and s.plan = 'business'
          and s.id::text = (storage.foldername(name))[1]
      )
    )
  )
  with check (
    (
      bucket_id = 'product-images'
      and exists (
        select 1 from public.shops s
        where s.owner_id = (select auth.uid())
          and s.id::text = (storage.foldername(name))[1]
      )
    )
    or
    (
      bucket_id = 'shop-logos'
      and exists (
        select 1 from public.shops s
        where s.owner_id = (select auth.uid())
          and s.plan = 'business'
          and s.id::text = (storage.foldername(name))[1]
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
          and s.id::text = (storage.foldername(name))[1]
      )
    )
    or
    (
      bucket_id = 'shop-logos'
      and exists (
        select 1 from public.shops s
        where s.owner_id = (select auth.uid())
          and s.plan = 'business'
          and s.id::text = (storage.foldername(name))[1]
      )
    )
  );

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/png','image/webp']::text[]
where id in ('shop-logos','product-images');

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

  select * into v_shop from public.shops
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

  select fee into v_delivery from public.shipping_zones
    where shop_id = v_shop.id and region = p_region and township = p_township;
  if v_delivery is null then
    v_delivery := v_shop.default_delivery_fee;
  end if;

  v_order_no := 'ORD-' || to_char(clock_timestamp(), 'YYMMDD') || '-'
                || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_status := case when p_payment_method = 'cod' then 'cod_pending' else 'pending_payment' end;
  v_address := nullif(concat_ws(', ', nullif(trim(p_street),''),
               nullif(trim(p_township),''), nullif(trim(p_region),'')), '');

  insert into public.orders (
    shop_id, order_no, customer_name, customer_phone, customer_address,
    region, township, payment_method, payment_ref_tail, status,
    item_total, delivery_fee, grand_total
  ) values (
    v_shop.id, v_order_no, trim(p_customer_name), trim(p_customer_phone), v_address,
    p_region, p_township, p_payment_method,
    case when p_payment_method = 'cod' then null else trim(p_payment_ref_tail) end,
    v_status, 0, v_delivery, 0
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

create or replace function public.lookup_order(
  p_shop_slug text,
  p_order_no text,
  p_phone text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_order jsonb;
begin
  perform private.enforce_rate_limit('lookup_order', 30, interval '5 minutes');

  if coalesce(length(trim(p_shop_slug)), 0) not between 3 and 40
     or coalesce(length(trim(p_order_no)), 0) not between 8 and 40
     or coalesce(length(trim(p_phone)), 0) not between 6 and 30 then
    raise exception 'invalid_lookup';
  end if;

  select jsonb_build_object(
    'order_no', o.order_no,
    'status', o.status,
    'payment_method', o.payment_method,
    'item_total', o.item_total,
    'delivery_fee', o.delivery_fee,
    'grand_total', o.grand_total,
    'created_at', o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('name', oi.name, 'price', oi.unit_price, 'qty', oi.qty))
      from public.order_items oi where oi.order_id = o.id
    ), '[]'::jsonb)
  )
  into v_order
  from public.orders o
  join public.shops s on s.id = o.shop_id
  where s.slug = p_shop_slug
    and o.order_no = p_order_no
    and regexp_replace(o.customer_phone, '[^0-9]', '', 'g')
        = regexp_replace(p_phone, '[^0-9]', '', 'g');

  if v_order is null then
    raise exception 'order_not_found';
  end if;
  return v_order;
end;
$$;

revoke all on function public.lookup_order(text,text,text)
  from public, anon, authenticated;
grant execute on function public.lookup_order(text,text,text)
  to anon, authenticated;

revoke all on function public.current_shop_usage() from anon;
do $guard$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$guard$;

