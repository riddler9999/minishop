-- Reconcile payment-proof auto activation with Pricing V1 entitlements.
-- This intentionally does NOT edit historical migration 0011. Runtime truth is
-- replaced here after 0016 has introduced the entitlement-aware admin activation
-- path and current 30,000 / 60,000 Ks pricing.
begin;

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
as $$
declare
  v_payment public.payment_proofs%rowtype;
  v_plan text;
  v_transaction_id text := nullif(btrim(p_transaction_id), '');
  v_status text;
  v_reason text;
begin
  select * into v_payment
  from public.payment_proofs
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'payment_proof_not_found';
  end if;

  -- Replays of an already-approved proof are idempotent. The entitlement grant
  -- already exists, so never start a fresh subscription cycle on retry.
  if v_payment.status = 'approved' then
    return jsonb_build_object(
      'ok', true,
      'payment_id', v_payment.id,
      'shop_id', v_payment.shop_id,
      'status', v_payment.status,
      'plan', v_payment.detected_plan,
      'amount', v_payment.amount,
      'transaction_id', v_payment.transaction_id,
      'replayed', true
    );
  end if;

  if v_transaction_id is null then
    v_status := 'manual_review';
    v_reason := 'transaction_id_required';
  elsif p_amount not in (30000, 60000) then
    v_status := 'rejected';
    v_reason := 'unsupported_plan_amount';
  elsif lower(regexp_replace(coalesce(p_receiver_name,''), '[^a-zA-Z]', '', 'g'))
        <> lower(regexp_replace('Moe Htet Kyaw', '[^a-zA-Z]', '', 'g')) then
    v_status := 'rejected';
    v_reason := 'receiver_name_mismatch';
  elsif coalesce(p_confidence,0) < 0.92 then
    v_status := 'manual_review';
    v_reason := 'verification_confidence_too_low';
  elsif exists (
    select 1 from public.payment_proofs
    where btrim(transaction_id) = v_transaction_id
      and id <> p_payment_id
  ) then
    v_status := 'rejected';
    v_reason := 'duplicate_transaction_id';
  end if;

  if v_status is not null then
    update public.payment_proofs
    set amount = p_amount,
        transaction_id = v_transaction_id,
        paid_at = p_paid_at,
        sender_name = p_sender_name,
        receiver_name = p_receiver_name,
        status = v_status,
        detected_plan = null,
        confidence = p_confidence,
        rejection_reason = v_reason,
        raw_extraction = coalesce(p_raw_extraction,'{}'::jsonb),
        verified_at = now()
    where id = p_payment_id;

    return jsonb_build_object(
      'ok', false,
      'payment_id', p_payment_id,
      'shop_id', v_payment.shop_id,
      'status', v_status,
      'reason', v_reason
    );
  end if;

  v_plan := case when p_amount = 30000 then 'starter' else 'business' end;

  -- Critical invariant: never update shops.plan alone. 0016 owns subscription
  -- activation and keeps shops.plan + shop_entitlements + ledger in sync.
  perform public.admin_activate_subscription(
    v_payment.shop_id,
    v_plan,
    'payment-proof:' || v_transaction_id
  );

  update public.payment_proofs
  set amount = p_amount,
      transaction_id = v_transaction_id,
      paid_at = p_paid_at,
      sender_name = p_sender_name,
      receiver_name = p_receiver_name,
      status = 'approved',
      detected_plan = v_plan,
      confidence = p_confidence,
      rejection_reason = null,
      raw_extraction = coalesce(p_raw_extraction,'{}'::jsonb),
      verified_at = now()
  where id = p_payment_id;

  return jsonb_build_object(
    'ok', true,
    'payment_id', p_payment_id,
    'shop_id', v_payment.shop_id,
    'status', 'approved',
    'plan', v_plan,
    'amount', p_amount,
    'transaction_id', v_transaction_id
  );
end;
$$;

revoke all on function public.activate_plan_from_verified_payment(
  uuid,text,integer,text,text,timestamptz,numeric,jsonb
) from public, anon, authenticated;

commit;
