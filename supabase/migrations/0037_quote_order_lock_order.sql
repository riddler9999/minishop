-- Issue #187: keep quote-aware checkout lock acquisition compatible with the
-- core place_order() path. quote_order() takes shared product locks while the
-- core function takes the entitlement lock before taking product update locks.
-- Serialising quote-aware checkouts at the shop row prevents two transactions
-- from holding each other's product-share lock while one waits for entitlement.
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
  v_shop public.shops%rowtype;
  v_existing public.orders%rowtype;
begin
  -- Take the shop lock before quote_order() takes shared product locks. This
  -- matches the effective serialisation of the core entitlement-consuming
  -- order path and prevents a same-shop quote/order lock inversion.
  select * into v_shop
  from public.shops
  where slug = p_shop_slug and is_active = true
  for update;

  if not found then
    raise exception 'shop_not_found';
  end if;

  -- Preserve the established idempotency contract: an ambiguous/lost-response
  -- retry with the same key returns the already-created order even if catalog
  -- pricing changed after that order committed.
  if p_idempotency_key is not null then
    select * into v_existing
    from public.orders
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
