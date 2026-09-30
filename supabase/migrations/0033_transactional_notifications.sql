-- Task 12: durable transactional notification outbox.
-- Forward-only. Do not apply to Production from this task.
begin;

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_type text not null check (event_type in (
    'order_created','order_status_changed','payment_approved','payment_rejected'
  )),
  channel text not null check (channel in ('email','unconfigured')),
  recipient text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','blocked')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error text,
  delivered_at timestamptz,
  lease_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_outbox_due_idx
  on public.notification_outbox (status, next_attempt_at, created_at);

alter table public.notification_outbox enable row level security;
revoke all on public.notification_outbox from anon, authenticated;
grant select, insert, update on public.notification_outbox to service_role;

create or replace function public.enqueue_notification(
  p_event_key text,
  p_event_type text,
  p_recipient text,
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_id uuid;
begin
  if nullif(btrim(p_event_key), '') is null then raise exception 'notification_event_key_required'; end if;
  if p_event_type not in ('order_created','order_status_changed','payment_approved','payment_rejected') then
    raise exception 'invalid_notification_event_type';
  end if;
  if nullif(btrim(p_recipient), '') is null then raise exception 'notification_recipient_required'; end if;

  insert into public.notification_outbox(event_key,event_type,channel,recipient,payload)
  values (btrim(p_event_key), p_event_type,'email',btrim(p_recipient),coalesce(p_payload,'{}'::jsonb))
  on conflict (event_key) do update
    set event_key = excluded.event_key
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.capture_order_notification_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_event_type text;
  v_event_key text;
begin
  if tg_op = 'INSERT' then
    v_event_type := 'order_created';
    v_event_key := 'order-created:' || new.id::text;
  elsif old.status is distinct from new.status then
    v_event_type := 'order_status_changed';
    v_event_key := 'order-status:' || new.id::text || ':' || new.status || ':' || new.updated_at::text;
  else
    return new;
  end if;

  insert into public.notification_outbox(
    event_key,event_type,channel,recipient,payload,status,last_error
  ) values (
    v_event_key,
    v_event_type,
    'unconfigured',
    new.customer_phone,
    jsonb_build_object(
      'order_no',new.order_no,
      'status',new.status,
      'grand_total',new.grand_total
    ),
    'blocked',
    'buyer_delivery_channel_unconfigured'
  )
  on conflict (event_key) do nothing;

  return new;
end;
$$;

drop trigger if exists orders_notification_outbox on public.orders;
create trigger orders_notification_outbox
after insert or update of status on public.orders
for each row execute function public.capture_order_notification_event();

create or replace function public.update_order_status_and_notify(
  p_order_no text,
  p_shop_id uuid,
  p_status text
) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_order public.orders%rowtype;
begin
  if auth.uid() is null or not exists (
    select 1 from public.shops
    where id = p_shop_id and owner_id = auth.uid()
  ) then
    raise exception 'forbidden';
  end if;

  select * into v_order from public.orders
  where order_no = p_order_no and shop_id = p_shop_id
  for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.status = p_status then return v_order.id; end if;

  update public.orders set status = p_status where id = v_order.id;
  return v_order.id;
end;
$$;

create or replace function public.review_application_and_notify(
  p_owner_id uuid,
  p_status text,
  p_review_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_app public.shop_applications%rowtype;
  v_email text;
begin
  if p_status not in ('approved','rejected') then raise exception 'invalid_application_status'; end if;

  select * into v_app from public.shop_applications
  where owner_id = p_owner_id and status = 'pending'
  for update;
  if not found then raise exception 'application_not_pending'; end if;

  select email into v_email from auth.users where id = p_owner_id;
  if nullif(btrim(v_email), '') is null then raise exception 'application_email_missing'; end if;

  update public.shop_applications
  set status = p_status, reviewed_at = now(), review_note = nullif(btrim(p_review_note),'')
  where owner_id = p_owner_id;

  perform public.enqueue_notification(
    'payment-review:' || p_owner_id::text || ':' || p_status || ':' || v_app.updated_at::text,
    case when p_status='approved' then 'payment_approved' else 'payment_rejected' end,
    v_email,
    jsonb_build_object(
      'plan', v_app.plan,
      'amount', v_app.amount,
      'status', p_status,
      'review_note', nullif(btrim(p_review_note),'')
    )
  );

  return jsonb_build_object('ok',true,'status',p_status,'owner_id',p_owner_id);
end;
$$;

revoke all on function public.enqueue_notification(text,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.capture_order_notification_event() from public, anon, authenticated;
revoke all on function public.review_application_and_notify(uuid,text,text) from public, anon, authenticated;
grant execute on function public.enqueue_notification(text,text,text,jsonb) to service_role;
grant execute on function public.review_application_and_notify(uuid,text,text) to service_role;

grant execute on function public.update_order_status_and_notify(text,uuid,text) to authenticated;

commit;