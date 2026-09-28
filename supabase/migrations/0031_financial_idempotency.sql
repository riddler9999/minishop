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

create unique index if not exists financial_admin_requests_idempotency_key_uidx
  on public.financial_admin_requests (idempotency_key);

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

drop function if exists public.admin_activate_subscription(uuid,text,text);
drop function if exists public.admin_renew_subscription(uuid,text);
drop function if exists public.admin_upgrade_plan(uuid,text);

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


create or replace function public.activate_plan_from_verified_payment(
  p_payment_id uuid,
  p_transaction_id text,
  p_amount integer,
  p_receiver_name text,
  p_sender_name text,
  p_paid_at timestamptz,
  p_confidence numeric,
  p_raw_extraction jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $
declare
  v_payment public.payment_proofs%rowtype;
  v_plan text;
  v_transaction_id text := nullif(btrim(p_transaction_id), '');
  v_status text;
  v_reason text;
begin
  select * into v_payment from public.payment_proofs where id=p_payment_id for update;
  if not found then raise exception 'payment_proof_not_found'; end if;
  if v_payment.status='approved' then
    return jsonb_build_object('ok',true,'payment_id',v_payment.id,'shop_id',v_payment.shop_id,'status',v_payment.status,'plan',v_payment.detected_plan,'amount',v_payment.amount,'transaction_id',v_payment.transaction_id,'replayed',true);
  end if;
  if v_transaction_id is null then v_status:='manual_review'; v_reason:='transaction_id_required';
  elsif p_amount not in (29000,79000) then v_status:='rejected'; v_reason:='unsupported_plan_amount';
  elsif lower(regexp_replace(coalesce(p_receiver_name,''),'[^a-zA-Z]','','g')) <> lower(regexp_replace('Moe Htet Kyaw','[^a-zA-Z]','','g')) then v_status:='rejected'; v_reason:='receiver_name_mismatch';
  elsif coalesce(p_confidence,0)<0.92 then v_status:='manual_review'; v_reason:='verification_confidence_too_low';
  elsif exists(select 1 from public.payment_proofs where btrim(transaction_id)=v_transaction_id and id<>p_payment_id) then v_status:='rejected'; v_reason:='duplicate_transaction_id';
  end if;
  if v_status is not null then
    update public.payment_proofs set amount=p_amount,transaction_id=v_transaction_id,paid_at=p_paid_at,sender_name=p_sender_name,receiver_name=p_receiver_name,status=v_status,detected_plan=null,confidence=p_confidence,rejection_reason=v_reason,raw_extraction=coalesce(p_raw_extraction,'{}'::jsonb),verified_at=now() where id=p_payment_id;
    return jsonb_build_object('ok',false,'payment_id',p_payment_id,'shop_id',v_payment.shop_id,'status',v_status,'reason',v_reason);
  end if;
  v_plan:=case when p_amount=29000 then 'starter' else 'business' end;
  perform public.admin_activate_subscription(v_payment.shop_id,v_plan,v_transaction_id,p_payment_id);
  update public.payment_proofs set amount=p_amount,transaction_id=v_transaction_id,paid_at=p_paid_at,sender_name=p_sender_name,receiver_name=p_receiver_name,status='approved',detected_plan=v_plan,confidence=p_confidence,rejection_reason=null,raw_extraction=coalesce(p_raw_extraction,'{}'::jsonb),verified_at=now() where id=p_payment_id;
  return jsonb_build_object('ok',true,'payment_id',p_payment_id,'shop_id',v_payment.shop_id,'status','approved','plan',v_plan,'amount',p_amount,'transaction_id',v_transaction_id);
end;
$;

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
