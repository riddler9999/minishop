begin;

-- Task 3 / F2: failed anonymous lookup attempts must survive the RPC transaction.
-- Keep the limiter database-distributed, but make stale-row cleanup bounded so one
-- request cannot trigger an unbounded delete.
create index if not exists api_rate_limits_requested_at_idx
  on private.api_rate_limits (requested_at);

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
  v_key := md5(coalesce(nullif(trim(v_raw_key), ''), 'unknown'));

  perform pg_advisory_xact_lock(hashtextextended(p_action || ':' || v_key, 0));

  delete from private.api_rate_limits
  where id in (
    select id
    from private.api_rate_limits
    where requested_at < now() - interval '1 day'
    order by requested_at asc
    limit 500
  );

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
revoke all on function private.enforce_rate_limit(text, integer, interval)
  from public, anon, authenticated;

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
  -- Count the attempt before business validation/lookup. Business failures below
  -- return typed JSON instead of raising, so this insert commits with the RPC.
  perform private.enforce_rate_limit('lookup_order', 30, interval '5 minutes');

  if coalesce(length(trim(p_shop_slug)), 0) not between 3 and 40
     or coalesce(length(trim(p_order_no)), 0) not between 8 and 40
     or coalesce(length(trim(p_phone)), 0) not between 6 and 30 then
    return jsonb_build_object('error', 'invalid_lookup');
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
    return jsonb_build_object('error', 'order_not_found');
  end if;

  return v_order;
end;
$$;

revoke all on function public.lookup_order(text,text,text)
  from public, anon, authenticated;
grant execute on function public.lookup_order(text,text,text)
  to anon, authenticated;

commit;
