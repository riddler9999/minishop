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

create schema if not exists store_design_private;
revoke all on schema store_design_private from public;
grant usage on schema store_design_private to anon, authenticated;

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

drop policy if exists store_designs_owner_select on public.store_designs;
create policy store_designs_owner_select on public.store_designs
  for select to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_id
      and s.owner_id = (select auth.uid())
  ));

revoke all on table public.store_designs from anon, authenticated;
grant select on table public.store_designs to authenticated;

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
              'productSource', jsonb_build_object('mode', 'dynamic', 'rule', 'new_arrivals', 'limit', 8)
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
                'rule', 'new_arrivals',
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

insert into public.store_designs (
  shop_id, draft_document, published_document, previous_published_document,
  draft_revision, published_revision, updated_at, published_at
)
select
  s.id,
  store_design_private.legacy_theme_to_store_design(s.theme),
  store_design_private.legacy_theme_to_store_design(s.theme),
  null, 1, 1, now(), now()
from public.shops s
on conflict (shop_id) do nothing;

create or replace function store_design_private.init_store_design_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.store_designs (
    shop_id, draft_document, published_document, previous_published_document,
    draft_revision, published_revision, updated_at, published_at
  ) values (
    new.id,
    store_design_private.legacy_theme_to_store_design(new.theme),
    store_design_private.legacy_theme_to_store_design(new.theme),
    null, 1, 1, now(), now()
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

  if not found then raise exception 'store_design_not_found'; end if;

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

  if not found then raise exception 'store_design_not_found'; end if;
  if v_design.draft_revision <> p_expected_revision then raise exception 'store_design_conflict'; end if;

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

  if not found then raise exception 'store_design_not_found'; end if;
  if v_design.draft_revision <> p_expected_draft_revision then raise exception 'store_design_conflict'; end if;
  if not store_design_private.is_store_design_document_valid(v_design.draft_document) then raise exception 'store_design_invalid'; end if;

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

  if not found then raise exception 'store_design_not_found'; end if;
  if v_design.previous_published_document is null then raise exception 'store_design_previous_missing'; end if;

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

-- Historical demand is defined by order creation. Later cancellation/RTO/refund
-- state does not subtract quantity. Aggregate in Postgres so the public gateway
-- receives only a bounded ranked id set and never needs order/order-item N+1 reads.
create or replace function store_design_private.load_best_selling_product_ids_internal(
  p_shop_slug text,
  p_limit integer
) returns table(product_id uuid, quantity bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select oi.product_id, sum(oi.qty)::bigint as quantity
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  join public.shops s on s.id = o.shop_id
  join public.products p on p.id = oi.product_id and p.shop_id = s.id
  where s.slug = p_shop_slug
    and s.is_active = true
    and p.status = 'active'
    and oi.product_id is not null
  group by oi.product_id
  order by quantity desc, oi.product_id asc
  limit least(greatest(p_limit, 1), 24);
$$;

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
revoke all on function store_design_private.load_best_selling_product_ids_internal(text,integer)
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
grant execute on function store_design_private.load_best_selling_product_ids_internal(text,integer)
  to anon, authenticated;

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

create or replace function public.load_best_selling_product_ids(
  p_shop_slug text,
  p_limit integer default 12
) returns table(product_id uuid, quantity bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from store_design_private.load_best_selling_product_ids_internal(
    p_shop_slug,
    least(greatest(p_limit, 1), 24)
  );
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
revoke all on function public.load_best_selling_product_ids(text,integer)
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
grant execute on function public.load_best_selling_product_ids(text,integer)
  to anon, authenticated;

commit;
