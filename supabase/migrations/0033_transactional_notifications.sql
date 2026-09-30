-- Task 12: durable transactional notification outbox.
-- Forward-only. Do not apply to Production from this task.
begin;

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_type text not null check (event_type in (
    'order_created','order_status_changed','payment_approved','payment_rejected'
  )),
  channel text not null default 'email' check (channel = 'email'),
  recipient text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error text,
  delivered_at timestamptz,
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

  insert into public.notification_outbox(event_key,event_type,recipient,payload)
  values (btrim(p_event_key), p_event_type, btrim(p_recipient), coalesce(p_payload,'{}'::jsonb))
  on conflict (event_key) do update
    set event_key = excluded.event_key
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.update_order_status_and_notify(
  p_order_no text,
  p_shop_id uuid,
  p_status text
) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.orders%rowtype;
  v_old_status text;
begin
  select * into v_order from public.orders
  where order_no = p_order_no and shop_id = p_shop_id
  for update;
  if not found then raise exception 'order_not_found'; end if;

  v_old_status := v_order.status;
  if v_old_status = p_status then return v_order.id; end if;

  update public.orders set status = p_status where id = v_order.id;

  perform public.enqueue_notification(
    'order-status:' || v_order.id::text || ':' || p_status,
    'order_status_changed',
    v_order.customer_phone,
    jsonb_build_object(
      'order_no', v_order.order_no,
      'old_status', v_old_status,
      'status', p_status,
      'grand_total', v_order.grand_total
    )
  );
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
revoke all on function public.review_application_and_notify(uuid,text,text) from public, anon, authenticated;
grant execute on function public.enqueue_notification(text,text,text,jsonb) to service_role;
grant execute on function public.review_application_and_notify(uuid,text,text) to service_role;

grant execute on function public.update_order_status_and_notify(text,uuid,text) to authenticated;

commit;