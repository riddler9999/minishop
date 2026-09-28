-- Task 8 / F7: immutable payment identity + admin financial request idempotency.
-- Forward-only. Do not apply to Production from this task.
begin;

create table if not exists public.financial_admin_requests (
  idempotency_key uuid primary key,
  payment_identity text not null,
  action text not null check (action in ('activate','renew','upgrade','credit_pack')),
  shop_id uuid not null references public.shops(id) on delete restrict,
  purchase_id uuid references public.order_pack_purchases(id) on delete restrict,
  request_fingerprint text not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists financial_admin_requests_payment_identity_uidx
  on public.financial_admin_requests (lower(btrim(payment_identity)));

revoke all on public.financial_admin_requests from anon, authenticated;
grant select, insert on public.financial_admin_requests to service_role;

create or replace function public.claim_financial_admin_request(
  p_idempotency_key uuid,
  p_payment_identity text,
  p_action text,
  p_shop_id uuid,
  p_purchase_id uuid,
  p_request_fingerprint text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_payment_identity text := nullif(btrim(p_payment_identity), '');
  v_existing public.financial_admin_requests%rowtype;
begin
  if p_idempotency_key is null then raise exception 'idempotency_key_required'; end if;
  if v_payment_identity is null then raise exception 'payment_identity_required'; end if;
  if p_action not in ('activate','renew','upgrade','credit_pack') then raise exception 'invalid_financial_action'; end if;
  if nullif(btrim(p_request_fingerprint), '') is null then raise exception 'invalid_financial_request'; end if;

  select * into v_existing
  from public.financial_admin_requests
  where idempotency_key = p_idempotency_key
  for update;

  if found then
    if lower(btrim(v_existing.payment_identity)) = lower(v_payment_identity)
       and v_existing.action = p_action
       and v_existing.shop_id = p_shop_id
       and v_existing.purchase_id is not distinct from p_purchase_id
       and v_existing.request_fingerprint = p_request_fingerprint then
      return jsonb_build_object('status','replay','result',v_existing.result);
    end if;
    raise exception 'idempotency_conflict';
  end if;

  if exists (
    select 1 from public.financial_admin_requests
    where lower(btrim(payment_identity)) = lower(v_payment_identity)
  ) then
    raise exception 'duplicate_payment_identity';
  end if;

  insert into public.financial_admin_requests
    (idempotency_key,payment_identity,action,shop_id,purchase_id,request_fingerprint,result)
  values
    (p_idempotency_key,v_payment_identity,p_action,p_shop_id,p_purchase_id,p_request_fingerprint,'{}'::jsonb);

  return jsonb_build_object('status','claimed');
end;
$$;

create or replace function public.finish_financial_admin_request(
  p_idempotency_key uuid,
  p_result jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_result jsonb := coalesce(p_result, '{}'::jsonb);
begin
  update public.financial_admin_requests
  set result = v_result
  where idempotency_key = p_idempotency_key;
  if not found then raise exception 'financial_request_not_found'; end if;
  return v_result;
end;
$$;

create or replace function public.admin_activate_subscription(
  p_shop_id uuid,
  p_plan text,
  p_payment_identity text,
  p_idempotency_key uuid
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_quota integer;
  v_claim jsonb;
  v_fingerprint text;
begin
  if p_plan not in ('starter','business') then raise exception 'invalid_plan'; end if;
  if not exists (select 1 from public.shops where id = p_shop_id) then raise exception 'unknown_shop'; end if;
  v_fingerprint := 'activate:' || p_shop_id::text || ':' || p_plan;
  v_claim := public.claim_financial_admin_request(p_idempotency_key,p_payment_identity,'activate',p_shop_id,null,v_fingerprint);
  if v_claim->>'status' = 'replay' then return v_claim->'result'; end if;

  perform 1 from public.shop_entitlements where shop_id = p_shop_id for update;
  v_quota := case p_plan when 'business' then 200 else 60 end;

  update public.shops set plan = p_plan where id = p_shop_id;
  insert into public.shop_entitlements
    (shop_id, plan, active, monthly_quota, monthly_used, purchased_balance, cycle_start, cycle_end)
  values (p_shop_id, p_plan, true, v_quota, 0, 0, now(), now() + interval '30 days')
  on conflict (shop_id) do update
    set plan = excluded.plan, active = true, monthly_quota = excluded.monthly_quota,
        monthly_used = 0, cycle_start = now(), cycle_end = now() + interval '30 days',
        pending_plan = null, updated_at = now();

  insert into public.entitlement_ledger
    (shop_id,event_type,monthly_delta,source_type,source_id,note)
  values (p_shop_id,'grant_monthly',v_quota,'financial_request',p_idempotency_key::text,
          'activate ' || p_plan || ' payment ' || btrim(p_payment_identity));

  return public.finish_financial_admin_request(
    p_idempotency_key,
    jsonb_build_object('ok',true,'action','activate','shop_id',p_shop_id,'plan',p_plan)
  );
end;
$$;

create or replace function public.admin_renew_subscription(
  p_shop_id uuid,
  p_payment_identity text,
  p_idempotency_key uuid
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_ent public.shop_entitlements%rowtype;
  v_plan text;
  v_quota integer;
  v_claim jsonb;
  v_fingerprint text := 'renew:' || p_shop_id::text;
begin
  v_claim := public.claim_financial_admin_request(p_idempotency_key,p_payment_identity,'renew',p_shop_id,null,v_fingerprint);
  if v_claim->>'status' = 'replay' then return v_claim->'result'; end if;

  select * into v_ent from public.shop_entitlements where shop_id = p_shop_id for update;
  if not found then raise exception 'unknown_shop'; end if;
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
    (shop_id,event_type,monthly_delta,source_type,source_id,note)
  values (p_shop_id,'renewal',v_quota,'financial_request',p_idempotency_key::text,
          'renew ' || v_plan || ' payment ' || btrim(p_payment_identity));

  return public.finish_financial_admin_request(
    p_idempotency_key,
    jsonb_build_object('ok',true,'action','renew','shop_id',p_shop_id,'plan',v_plan)
  );
end;
$$;

create or replace function public.admin_upgrade_plan(
  p_shop_id uuid,
  p_payment_identity text,
  p_idempotency_key uuid
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_ent public.shop_entitlements%rowtype;
  v_claim jsonb;
  v_fingerprint text := 'upgrade:' || p_shop_id::text || ':business';
begin
  v_claim := public.claim_financial_admin_request(p_idempotency_key,p_payment_identity,'upgrade',p_shop_id,null,v_fingerprint);
  if v_claim->>'status' = 'replay' then return v_claim->'result'; end if;

  select * into v_ent from public.shop_entitlements where shop_id = p_shop_id for update;
  if not found then raise exception 'unknown_shop'; end if;
  if v_ent.plan <> 'starter' then raise exception 'invalid_plan'; end if;

  update public.shops set plan = 'business' where id = p_shop_id;
  update public.shop_entitlements
    set plan = 'business', monthly_quota = 200, active = true, pending_plan = null, updated_at = now()
    where shop_id = p_shop_id;

  insert into public.entitlement_ledger
    (shop_id,event_type,monthly_delta,source_type,source_id,note)
  values (p_shop_id,'upgrade',200-v_ent.monthly_quota,'financial_request',p_idempotency_key::text,
          'upgrade starter->business, used ' || v_ent.monthly_used || ' preserved; payment ' || btrim(p_payment_identity));

  return public.finish_financial_admin_request(
    p_idempotency_key,
    jsonb_build_object('ok',true,'action','upgrade','shop_id',p_shop_id,'plan','business')
  );
end;
$$;

drop function if exists public.admin_credit_order_pack(uuid,text);
create or replace function public.admin_credit_order_pack(
  p_purchase_id uuid,
  p_payment_identity text,
  p_idempotency_key uuid
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_p public.order_pack_purchases%rowtype;
  v_claim jsonb;
  v_fingerprint text;
begin
  select * into v_p from public.order_pack_purchases where id = p_purchase_id for update;
  if not found then raise exception 'unknown_purchase'; end if;
  if v_p.qty <= 0 then raise exception 'invalid_credit_quantity'; end if;
  v_fingerprint := 'credit_pack:' || p_purchase_id::text || ':' || v_p.shop_id::text || ':' || v_p.qty::text;

  v_claim := public.claim_financial_admin_request(
    p_idempotency_key,p_payment_identity,'credit_pack',v_p.shop_id,p_purchase_id,v_fingerprint
  );
  if v_claim->>'status' = 'replay' then return v_claim->'result'; end if;

  if v_p.status = 'approved' then raise exception 'purchase_already_approved'; end if;

  update public.order_pack_purchases
  set status='approved', transaction_id=btrim(p_payment_identity), reviewed_at=now(), updated_at=now()
  where id=p_purchase_id;

  update public.shop_entitlements
  set purchased_balance = purchased_balance + v_p.qty, updated_at = now()
  where shop_id = v_p.shop_id;

  insert into public.entitlement_ledger
    (shop_id,event_type,purchased_delta,source_type,source_id,note)
  values (v_p.shop_id,'purchase_extra',v_p.qty,'financial_request',p_idempotency_key::text,
          'approved pack ' || p_purchase_id::text || ' payment ' || btrim(p_payment_identity));

  return public.finish_financial_admin_request(
    p_idempotency_key,
    jsonb_build_object('ok',true,'action','credit_pack','shop_id',v_p.shop_id,'purchase_id',p_purchase_id,'qty',v_p.qty)
  );
end;
$$;

revoke all on function public.claim_financial_admin_request(uuid,text,text,uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.finish_financial_admin_request(uuid,jsonb) from public, anon, authenticated;
revoke all on function public.admin_activate_subscription(uuid,text,text,uuid) from public, anon, authenticated;
revoke all on function public.admin_renew_subscription(uuid,text,uuid) from public, anon, authenticated;
revoke all on function public.admin_upgrade_plan(uuid,text,uuid) from public, anon, authenticated;
revoke all on function public.admin_credit_order_pack(uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.admin_activate_subscription(uuid,text,text,uuid) to service_role;
grant execute on function public.admin_renew_subscription(uuid,text,uuid) to service_role;
grant execute on function public.admin_upgrade_plan(uuid,text,uuid) to service_role;
grant execute on function public.admin_credit_order_pack(uuid,text,uuid) to service_role;

commit;
