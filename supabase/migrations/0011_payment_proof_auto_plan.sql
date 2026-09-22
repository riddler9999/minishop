-- Payment proof verification + idempotent plan activation
begin;

create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  owner_id uuid not null,
  screenshot_url text not null,
  amount integer,
  transaction_id text,
  paid_at timestamptz,
  sender_name text,
  receiver_name text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','manual_review')),
  detected_plan text
    check (detected_plan is null or detected_plan in ('starter','business')),
  confidence numeric(5,4),
  rejection_reason text,
  raw_extraction jsonb,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create unique index if not exists payment_proofs_transaction_id_uidx
  on public.payment_proofs (btrim(transaction_id))
  where transaction_id is not null and btrim(transaction_id) <> '';

create index if not exists payment_proofs_shop_created_idx
  on public.payment_proofs (shop_id, created_at desc);

alter table public.payment_proofs enable row level security;

drop policy if exists payment_proofs_owner_select on public.payment_proofs;
create policy payment_proofs_owner_select on public.payment_proofs
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists payment_proofs_owner_insert on public.payment_proofs;
create policy payment_proofs_owner_insert on public.payment_proofs
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.shops s
      where s.id = shop_id and s.owner_id = (select auth.uid())
    )
  );

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
  -- Lock the proof first so every verification attempt has a durable outcome.
  select * into v_payment
  from public.payment_proofs
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'payment_proof_not_found';
  end if;

  if v_transaction_id is null then
    v_status := 'manual_review';
    v_reason := 'transaction_id_required';
  elsif p_amount not in (50000, 80000) then
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

  if p_amount = 50000 then
    v_plan := 'starter';
  else
    v_plan := 'business';
  end if;

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

  update public.shops
  set plan = v_plan
  where id = v_payment.shop_id;

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
