-- PR4 delivery runtime smoke test.
-- Safe for production verification: all test mutations must stay inside this
-- transaction and the script always ends with ROLLBACK.
begin;

do $$
declare
  v_shop public.shops%rowtype;
  v_fee bigint;
  v_expected bigint;
begin
  select * into v_shop
  from public.shops
  where is_active = true and delivery_service = 'custom'
  order by created_at
  limit 1;

  if not found then
    raise exception 'smoke_no_active_custom_shop';
  end if;

  -- Existing custom shops must preserve shipping-zone pricing.
  select fee into v_expected
  from public.shipping_zones
  where shop_id = v_shop.id
  order by region, township
  limit 1;

  if v_expected is not null then
    select public.resolve_delivery_fee(v_shop.id, region, township)
      into v_fee
    from public.shipping_zones
    where shop_id = v_shop.id
    order by region, township
    limit 1;

    if v_fee is distinct from v_expected then
      raise exception 'smoke_zone_fee_mismatch';
    end if;
  end if;

  -- Unknown custom routes must preserve the legacy default-delivery-fee fallback.
  select public.resolve_delivery_fee(
    v_shop.id,
    '__MINISHOP_SMOKE_REGION__',
    '__MINISHOP_SMOKE_TOWNSHIP__'
  ) into v_fee;

  if v_fee is distinct from v_shop.default_delivery_fee then
    raise exception 'smoke_default_fee_mismatch';
  end if;
end $$;

-- Schema/function contract added by the reconciliation migration.
do $$
begin
  if to_regclass('public.ninjavan_rates') is null then
    raise exception 'smoke_ninjavan_rates_missing';
  end if;
  if to_regprocedure('public.resolve_delivery_fee(uuid,text,text)') is null then
    raise exception 'smoke_resolver_missing';
  end if;
  if to_regprocedure('public.place_order(text,text,text,text,text,text,text,text,jsonb,uuid)') is null then
    raise exception 'smoke_place_order_contract_missing';
  end if;
end $$;

rollback;
