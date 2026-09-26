-- =============================================================================
-- MiniShop Store Builder — Store Design lifecycle persistence
--
-- ADDITIVE ONLY. This migration deliberately preserves public.shops.theme as the
-- legacy compatibility source. It must NOT be applied to Production without the
-- project owner's separate explicit approval.
--
-- Lifecycle: Draft -> Published -> Previous Published.
-- One row per shop. Sellers may read their own lifecycle row directly, but all
-- writes go through revision-aware RPCs so direct table mutation cannot bypass
-- optimistic concurrency or publish/rollback invariants.
-- =============================================================================

begin;

-- Privileged implementations live outside the exposed public Data API schema.
create schema if not exists store_design_private;
revoke all on schema store_design_private from public;
grant usage on schema store_design_private to anon, authenticated;

-- ---- 1. Lifecycle row -------------------------------------------------------
create table if not exists public.store_designs (
  shop_id                      uuid primary key references public.shops(id) on delete cascade,
  draft_document               jsonb not null,
  published_document           jsonb not null,
  previous_published_document  jsonb,
  draft_revision               bigint not null default 1 check (draft_revision >= 1),
  published_revision           bigint not null default 1 check (published_revision >= 1),
  updated_at                   timestamptz not null default now(),
  published_at                 timestamptz
);

alter table public.store_designs enable row level security;

-- Seller may inspect only the lifecycle belonging to their own Shop.
drop policy if exists store_designs_owner_select on public.store_designs;
create policy store_designs_owner_select on public.store_designs
  for select to authenticated
  using (exists (
    select 1
    from public.shops s
    where s.id = shop_id
      and s.owner_id = (select auth.uid())
  ));

-- No direct seller/anon writes. Mutations are RPC-only.
revoke all on table public.store_designs from anon, authenticated;
grant select on table public.store_designs to authenticated;

-- ---- 2. Validation boundary -------------------------------------------------
-- Publish/save accept only normalized Store Design v1. The application domain
-- performs richer typed normalization; this DB predicate independently enforces
-- the load-bearing persistence + Buy Now invariants.
create or replace function store_design_private.is_store_design_document_valid(
  p_document jsonb
) returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select
    jsonb_typeof(p_document) = 'object'
    and p_document->>'schemaVersion' = '1'
    and nullif(btrim(coalesce(p_document->>'themeId', '')), '') is not null
    and jsonb_typeof(p_document->'globalSettings') = 'object'
    and jsonb_typeof(p_document->'templates') = 'object'
    and jsonb_typeof(p_document #> '{templates,home}') = 'object'
    and jsonb_typeof(p_document #> '{templates,collection}') = 'object'
    and jsonb_typeof(p_document #> '{templates,product}') = 'object'
    and jsonb_typeof(p_document #> '{templates,home,sections}') = 'array'
    and jsonb_typeof(p_document #> '{templates,collection,sections}') = 'array'
    and jsonb_typeof(p_document #> '{templates,product,sections}') = 'array'
    and nullif(btrim(coalesce(p_document #>> '{globalSettings,buyNow,label}', '')), '') is not null
    and coalesce(p_document #>> '{globalSettings,buyNow,disabled}', '') = 'false';
$$;

revoke all on function store_design_private.is_store_design_document_valid(jsonb)
  from public, anon, authenticated;

-- Legacy shops.theme is allowed only as a transitional Previous Published slot.
-- Buyer/domain normalization remains fail-safe during the compatibility window.
create or replace function store_design_private.is_legacy_store_theme_compatible(
  p_document jsonb
) returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select jsonb_typeof(p_document) = 'object'
    and not (p_document ? 'schemaVersion');
$$;

revoke all on function store_design_private.is_legacy_store_theme_compatible(jsonb)
  from public, anon, authenticated;


-- Convert legacy shops.theme into Store Design v1 for lifecycle backfill.
create or replace function store_design_private.legacy_theme_to_store_design(
  p_theme jsonb
) returns jsonb
language sql
immutable
security invoker
set search_path = ''
as $legacy$
  with legacy as (
    select coalesce(p_theme, '{}'::jsonb) as t
  ),
  preset as (
    select case coalesce(t->>'presetId', 'soft-elegant')
      when 'clean-minimal' then 'clean-minimal'
      when 'street-bold' then 'street-bold'
      when 'soft-elegant' then 'soft-elegant'
      when 'grid-catalog' then 'grid-catalog'
      when 'dark-modern' then 'dark-modern'
      when 'minimal' then 'clean-minimal'
      when 'fashion' then 'soft-elegant'
      when 'dark-luxury' then 'dark-modern'
      when 'fresh-market' then 'grid-catalog'
      when 'modern-shop' then 'street-bold'
      else 'soft-elegant'
    end as theme_id,
    t
    from legacy
  )
  select jsonb_build_object(
    'schemaVersion', 1,
    'themeId', theme_id,
    'globalSettings', jsonb_build_object(
      'accentColor', coalesce(t->>'accentColor', '#ec4899'),
      'fontPairing', coalesce(t->>'fontPairing', 'minimal'),
      'buyNow', jsonb_build_object(
        'label', coalesce(t #>> '{product,buyNowLabel}', 'ဝယ်မည်'),
        'style', 'solid',
        'width', 'full',
        'disabled', false
      )
    ),
    'templates', jsonb_build_object(
      'home', jsonb_build_object(
        'sections', jsonb_build_array(
          jsonb_build_object(
            'id', 'home-announcement-1',
            'type', 'announcement',
            'enabled', coalesce((t #>> '{announcement,enabled}')::boolean, false),
            'settings', jsonb_build_object('text', coalesce(t #>> '{announcement,text}', ''))
          ),
          jsonb_build_object(
            'id', 'home-hero-2',
            'type', 'hero',
            'enabled', coalesce((t #>> '{home,heroEnabled}')::boolean, true),
            'settings', jsonb_build_object(
              'headline', coalesce(t #>> '{home,heroHeadline}', ''),
              'subtext', coalesce(t #>> '{home,heroSubtext}', ''),
              'ctaLabel', coalesce(t #>> '{home,heroCtaLabel}', 'ပစ္စည်းများကြည့်ရန်'),
              'imageUrl', nullif(t #>> '{home,heroImageUrl}', '')
            )
          ),
          jsonb_build_object(
            'id', 'home-featured-products-3',
            'type', 'featured-products',
            'enabled', true,
            'settings', jsonb_build_object(
              'title', coalesce(t #>> '{home,featuredTitle}', 'ရွေးချယ်ထားသော ပစ္စည်းများ'),
              'productSource', jsonb_build_object('mode', 'manual', 'productIds', jsonb_build_array())
            )
          )
        )
      ),
      'collection', jsonb_build_object(
        'sections', jsonb_build_array(
          jsonb_build_object(
            'id', 'collection-product-collection-1',
            'type', 'product-collection',
            'enabled', true,
            'settings', jsonb_build_object(
              'title', coalesce(t #>> '{category,heading}', 'စုစည်းမှု'),
              'productSource', jsonb_build_object(
                'mode', 'dynamic',
                'rule', 'category',
                'category', '',
                'limit', 12
              )
            )
          )
        )
      ),
      'product', jsonb_build_object(
        'sections', jsonb_build_array(
          jsonb_build_object(
            'id', 'product-product-gallery-1',
            'type', 'product-gallery',
            'enabled', true,
            'settings', jsonb_build_object('layout', 'carousel')
          ),
          jsonb_build_object(
            'id', 'product-product-info-2',
            'type', 'product-info',
            'enabled', true,
            'settings', jsonb_build_object('showPrice', true)
          )
        )
      )
    )
  )
  from preset;
$legacy$;

revoke all on function store_design_private.legacy_theme_to_store_design(jsonb)
  from public, anon, authenticated;

-- ---- 3. Existing-shop backfill ---------------------------------------------
-- Copy, never delete or rewrite, shops.theme. Runtime/domain compatibility
-- normalization turns these legacy-shaped initial documents into Store Design v1.
insert into public.store_designs (
  shop_id,
  draft_document,
  published_document,
  previous_published_document,
  draft_revision,
  published_revision,
  updated_at,
  published_at
)
select
  s.id,
  store_design_private.legacy_theme_to_store_design(s.theme),
  store_design_private.legacy_theme_to_store_design(s.theme),
  null,
  1,
  1,
  now(),
  now()
from public.shops s
on conflict (shop_id) do nothing;

-- Future shops receive the same additive lifecycle initialization.
create or replace function store_design_private.init_store_design_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.store_designs (
    shop_id,
    draft_document,
    published_document,
    previous_published_document,
    draft_revision,
    published_revision,
    updated_at,
    published_at
  ) values (
    new.id,
    store_design_private.legacy_theme_to_store_design(new.theme),
    store_design_private.legacy_theme_to_store_design(new.theme),
    null,
    1,
    1,
    now(),
    now()
  )
  on conflict (shop_id) do nothing;
  return new;
end;
$$;

revoke all on function store_design_private.init_store_design_lifecycle()
  from public, anon, authenticated;

drop trigger if exists init_store_design_lifecycle_after_shop on public.shops;
create trigger init_store_design_lifecycle_after_shop
  after insert on public.shops
  for each row execute function store_design_private.init_store_design_lifecycle();

-- ---- 4. Private owner-resolved lifecycle operations -------------------------
create or replace function store_design_private.load_own_store_design_internal()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_design public.store_designs%rowtype;
begin
  select sd.* into v_design
  from public.store_designs sd
  join public.shops s on s.id = sd.shop_id
  where s.owner_id = (select auth.uid())
  limit 1;

  if not found then
    raise exception 'store_design_not_found';
  end if;

  return jsonb_build_object(
    'shop_id', v_design.shop_id,
    'draft_document', v_design.draft_document,
    'published_document', v_design.published_document,
    'previous_published_document', v_design.previous_published_document,
    'draft_revision', v_design.draft_revision,
    'published_revision', v_design.published_revision,
    'updated_at', v_design.updated_at,
    'published_at', v_design.published_at
  );
end;
$$;

create or replace function store_design_private.save_store_design_draft_internal(
  p_expected_revision bigint,
  p_document jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_design public.store_designs%rowtype;
begin
  if not store_design_private.is_store_design_document_valid(p_document) then
    raise exception 'store_design_invalid';
  end if;

  select sd.* into v_design
  from public.store_designs sd
  join public.shops s on s.id = sd.shop_id
  where s.owner_id = (select auth.uid())
  for update of sd;

  if not found then
    raise exception 'store_design_not_found';
  end if;

  if v_design.draft_revision <> p_expected_revision then
    raise exception 'store_design_conflict';
  end if;

  update public.store_designs
  set draft_document = p_document,
      draft_revision = draft_revision + 1,
      updated_at = now()
  where shop_id = v_design.shop_id
  returning * into v_design;

  return jsonb_build_object(
    'document', v_design.draft_document,
    'revision', v_design.draft_revision,
    'updated_at', v_design.updated_at
  );
end;
$$;

create or replace function store_design_private.publish_store_design_draft_internal(
  p_expected_draft_revision bigint
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_design public.store_designs%rowtype;
begin
  select sd.* into v_design
  from public.store_designs sd
  join public.shops s on s.id = sd.shop_id
  where s.owner_id = (select auth.uid())
  for update of sd;

  if not found then
    raise exception 'store_design_not_found';
  end if;

  if v_design.draft_revision <> p_expected_draft_revision then
    raise exception 'store_design_conflict';
  end if;

  if not store_design_private.is_store_design_document_valid(v_design.draft_document) then
    raise exception 'store_design_invalid';
  end if;

  update public.store_designs
  set previous_published_document = published_document,
      published_document = draft_document,
      published_revision = published_revision + 1,
      updated_at = now(),
      published_at = now()
  where shop_id = v_design.shop_id
  returning * into v_design;

  return jsonb_build_object(
    'shop_id', v_design.shop_id,
    'draft_document', v_design.draft_document,
    'published_document', v_design.published_document,
    'previous_published_document', v_design.previous_published_document,
    'draft_revision', v_design.draft_revision,
    'published_revision', v_design.published_revision,
    'updated_at', v_design.updated_at,
    'published_at', v_design.published_at
  );
end;
$$;

create or replace function store_design_private.rollback_store_design_published_internal()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_design public.store_designs%rowtype;
begin
  select sd.* into v_design
  from public.store_designs sd
  join public.shops s on s.id = sd.shop_id
  where s.owner_id = (select auth.uid())
  for update of sd;

  if not found then
    raise exception 'store_design_not_found';
  end if;

  if v_design.previous_published_document is null then
    raise exception 'store_design_previous_missing';
  end if;

  if not store_design_private.is_store_design_document_valid(v_design.previous_published_document)
     and not store_design_private.is_legacy_store_theme_compatible(v_design.previous_published_document) then
    raise exception 'store_design_invalid';
  end if;

  update public.store_designs
  set previous_published_document = v_design.published_document,
      published_document = v_design.previous_published_document,
      published_revision = published_revision + 1,
      updated_at = now(),
      published_at = now()
  where shop_id = v_design.shop_id
  returning * into v_design;

  return jsonb_build_object(
    'shop_id', v_design.shop_id,
    'draft_document', v_design.draft_document,
    'published_document', v_design.published_document,
    'previous_published_document', v_design.previous_published_document,
    'draft_revision', v_design.draft_revision,
    'published_revision', v_design.published_revision,
    'updated_at', v_design.updated_at,
    'published_at', v_design.published_at
  );
end;
$$;

-- Buyer path exposes Published only. It accepts a public slug, never shop_id.
create or replace function store_design_private.load_published_store_design_internal(
  p_shop_slug text
) returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'document', sd.published_document,
    'revision', sd.published_revision,
    'published_at', sd.published_at
  )
  from public.store_designs sd
  join public.shops s on s.id = sd.shop_id
  where s.slug = p_shop_slug
    and s.is_active = true
  limit 1;
$$;

-- Internal functions are not exposed by PostgREST. Grant only the exact callers
-- needed by the public SECURITY INVOKER wrappers below.
revoke all on function store_design_private.load_own_store_design_internal()
  from public, anon, authenticated;
revoke all on function store_design_private.save_store_design_draft_internal(bigint,jsonb)
  from public, anon, authenticated;
revoke all on function store_design_private.publish_store_design_draft_internal(bigint)
  from public, anon, authenticated;
revoke all on function store_design_private.rollback_store_design_published_internal()
  from public, anon, authenticated;
revoke all on function store_design_private.load_published_store_design_internal(text)
  from public, anon, authenticated;

grant execute on function store_design_private.load_own_store_design_internal()
  to authenticated;
grant execute on function store_design_private.save_store_design_draft_internal(bigint,jsonb)
  to authenticated;
grant execute on function store_design_private.publish_store_design_draft_internal(bigint)
  to authenticated;
grant execute on function store_design_private.rollback_store_design_published_internal()
  to authenticated;
grant execute on function store_design_private.load_published_store_design_internal(text)
  to anon, authenticated;

-- ---- 5. Narrow public RPC wrappers ------------------------------------------
create or replace function public.load_own_store_design()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select store_design_private.load_own_store_design_internal();
$$;

create or replace function public.save_store_design_draft(
  p_expected_revision bigint,
  p_document jsonb
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select store_design_private.save_store_design_draft_internal(p_expected_revision, p_document);
$$;

create or replace function public.publish_store_design_draft(
  p_expected_draft_revision bigint
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select store_design_private.publish_store_design_draft_internal(p_expected_draft_revision);
$$;

create or replace function public.rollback_store_design_published()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select store_design_private.rollback_store_design_published_internal();
$$;

create or replace function public.load_published_store_design(
  p_shop_slug text
) returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select store_design_private.load_published_store_design_internal(p_shop_slug);
$$;

revoke all on function public.load_own_store_design()
  from public, anon, authenticated;
revoke all on function public.save_store_design_draft(bigint,jsonb)
  from public, anon, authenticated;
revoke all on function public.publish_store_design_draft(bigint)
  from public, anon, authenticated;
revoke all on function public.rollback_store_design_published()
  from public, anon, authenticated;
revoke all on function public.load_published_store_design(text)
  from public, anon, authenticated;

grant execute on function public.load_own_store_design()
  to authenticated;
grant execute on function public.save_store_design_draft(bigint,jsonb)
  to authenticated;
grant execute on function public.publish_store_design_draft(bigint)
  to authenticated;
grant execute on function public.rollback_store_design_published()
  to authenticated;
grant execute on function public.load_published_store_design(text)
  to anon, authenticated;

commit;
