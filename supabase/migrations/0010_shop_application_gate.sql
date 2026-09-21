-- =============================================================================
-- Mini TikTok Shop — Paid onboarding gate (plan purchase + manual approval)
--
-- A seller must now BUY a plan (Starter / Business) and get the platform owner's
-- manual approval BEFORE they may create their shop. The new flow is:
--
--   Signup -> Confirm -> Login
--     -> submit shop_application (plan + payment method + transfer screenshot)
--     -> [owner reviews the screenshot in the Supabase dashboard]
--     -> owner sets status = 'approved'  (and shops.plan later, if Business)
--     -> Onboarding (shop creation)
--     -> Admin console
--
-- APPROVAL IS MANUAL AND OWNER-ONLY. There is no in-app super-admin surface
-- (matches the manual last-5 payment-verification MVP philosophy, PROJECT.md
-- D4-D6). The owner reviews `shop_applications` + the `payment-proofs` object
-- in the Supabase dashboard, then flips `status` there. The dashboard runs as
-- service_role (auth.uid() is null), so the seller-facing guard trigger below
-- never applies to it — only authenticated sellers are constrained.
--
-- PURELY ADDITIVE. No table/column is dropped, renamed or retyped; nothing in
-- place_order()/lookup_order() or existing RLS is touched.
-- =============================================================================

begin;

-- ---- 1. shop_applications ---------------------------------------------------
-- One application per seller (PK = owner_id = auth.uid()). Holds the requested
-- plan, the payment method used, an optional last-5 transfer note, and the
-- storage path of the uploaded transfer screenshot. `status` is the gate the
-- frontend routes on; it is PLATFORM-managed (see the trigger) so a seller can
-- never self-approve. `amount` is informational only (the owner verifies the
-- real transfer against the screenshot) — it is never trusted for enforcement.
create table if not exists public.shop_applications (
  owner_id         uuid primary key references auth.users(id) on delete cascade,
  plan             text not null check (plan in ('starter','business')),
  payment_method   text not null check (payment_method in ('kpay','wave','aya')),
  payment_ref_tail text check (payment_ref_tail is null or payment_ref_tail ~ '^[0-9]{5}$'),
  screenshot_path  text not null,
  amount           integer not null check (amount >= 0),
  status           text not null default 'pending'
                     check (status in ('pending','approved','rejected')),
  review_note      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  reviewed_at      timestamptz
);

alter table public.shop_applications enable row level security;

-- ---- 2. RLS: a seller sees + manages ONLY their own application -------------
drop policy if exists shop_applications_owner_select on public.shop_applications;
create policy shop_applications_owner_select on public.shop_applications
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists shop_applications_owner_insert on public.shop_applications;
create policy shop_applications_owner_insert on public.shop_applications
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists shop_applications_owner_update on public.shop_applications;
create policy shop_applications_owner_update on public.shop_applications
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
-- No delete policy: sellers never delete an application; the owner may in the
-- dashboard (service_role bypasses RLS).

-- ---- 3. Guard: status is platform-managed -----------------------------------
-- Mirrors protect_shop_managed_fields() (0007): only constrain authenticated
-- callers, so the owner acting through the dashboard (service_role, auth.uid()
-- null) can freely approve/reject. A seller may only:
--   * INSERT with status = 'pending'
--   * UPDATE a pending/rejected application, keeping status = 'pending'
--     (i.e. resubmit a rejected one with a fresh screenshot)
-- and may never move it to 'approved'/'rejected' themselves, edit an already-
-- approved application, or reassign owner_id. `updated_at` is stamped here so
-- the owner sees when a seller last resubmitted.
create or replace function public.protect_shop_application()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      if new.status <> 'pending' then
        raise exception 'application_status_is_platform_managed';
      end if;
    elsif tg_op = 'UPDATE' then
      if new.owner_id is distinct from old.owner_id then
        raise exception 'application_owner_is_immutable';
      end if;
      if old.status = 'approved' then
        raise exception 'application_already_approved';
      end if;
      if new.status <> 'pending' then
        raise exception 'application_status_is_platform_managed';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists shop_applications_protect on public.shop_applications;
create trigger shop_applications_protect
  before insert or update on public.shop_applications
  for each row execute function public.protect_shop_application();

grant select, insert, update on public.shop_applications to authenticated;

-- ---- 4. Storage: private payment-proofs bucket ------------------------------
-- PRIVATE (public = false): a transfer screenshot is sensitive and must not be
-- world-readable like the shop-logos/product-images buckets. Path scheme is
-- owner-scoped by the first folder segment:  payment-proofs/<owner_id>/<file>.
-- The seller reads their own proof via a short-lived signed URL; the owner
-- reviews it in the dashboard. JPEG is accepted here (banking-app screenshots
-- are commonly JPG) alongside PNG/WebP — this bucket is proof capture, not the
-- PNG/WebP-only storefront media pipeline.
insert into storage.buckets (id, name, public)
values ('payment-proofs','payment-proofs', false)
on conflict (id) do nothing;

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/png','image/webp','image/jpeg']::text[]
where id = 'payment-proofs';

drop policy if exists payment_proofs_owner_insert on storage.objects;
create policy payment_proofs_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists payment_proofs_owner_select on storage.objects;
create policy payment_proofs_owner_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists payment_proofs_owner_update on storage.objects;
create policy payment_proofs_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists payment_proofs_owner_delete on storage.objects;
create policy payment_proofs_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

commit;
