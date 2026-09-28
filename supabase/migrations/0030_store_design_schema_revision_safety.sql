-- =============================================================================
-- MiniShop Task 7 — Store Design schema + revision safety hardening
-- Forward-only. Historical migration 0024 remains immutable.
-- =============================================================================

begin;

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
    and octet_length(p_document::text) <= 262144
    and jsonb_typeof(p_document->'schemaVersion') = 'number'
    and p_document->>'schemaVersion' = '1'
    and jsonb_typeof(p_document->'themeId') = 'string'
    and length(p_document->>'themeId') between 1 and 100
    and jsonb_typeof(p_document->'globalSettings') = 'object'
    and jsonb_typeof(p_document->'templates') = 'object'
    and jsonb_typeof(p_document #> '{templates,home}') = 'object'
    and jsonb_typeof(p_document #> '{templates,collection}') = 'object'
    and jsonb_typeof(p_document #> '{templates,product}') = 'object'
    and jsonb_typeof(p_document #> '{templates,home,sections}') = 'array'
    and jsonb_typeof(p_document #> '{templates,collection,sections}') = 'array'
    and jsonb_typeof(p_document #> '{templates,product,sections}') = 'array'
    and jsonb_array_length(p_document #> '{templates,home,sections}') <= 50
    and jsonb_array_length(p_document #> '{templates,collection,sections}') <= 50
    and jsonb_array_length(p_document #> '{templates,product,sections}') <= 50
    and jsonb_typeof(p_document #> '{globalSettings,buyNow}') = 'object'
    and jsonb_typeof(p_document #> '{globalSettings,buyNow,label}') = 'string'
    and length(p_document #>> '{globalSettings,buyNow,label}') between 1 and 120
    and jsonb_typeof(p_document #> '{globalSettings,buyNow,disabled}') = 'boolean'
    and (p_document #>> '{globalSettings,buyNow,disabled}')::boolean = false;
$$;

revoke all on function store_design_private.is_store_design_document_valid(jsonb)
  from public, anon, authenticated;

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
  if p_expected_revision is null or p_expected_revision < 1 then
    raise exception 'store_design_revision_invalid';
  end if;

  if store_design_private.is_store_design_document_valid(p_document) is not true then
    raise exception 'store_design_invalid';
  end if;

  select sd.* into v_design
  from public.store_designs sd
  join public.shops s on s.id = sd.shop_id
  where s.owner_id = (select auth.uid())
  for update of sd;

  if not found then raise exception 'store_design_not_found'; end if;
  if v_design.draft_revision is distinct from p_expected_revision then
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
  if p_expected_draft_revision is null or p_expected_draft_revision < 1 then
    raise exception 'store_design_revision_invalid';
  end if;

  select sd.* into v_design
  from public.store_designs sd
  join public.shops s on s.id = sd.shop_id
  where s.owner_id = (select auth.uid())
  for update of sd;

  if not found then raise exception 'store_design_not_found'; end if;
  if v_design.draft_revision is distinct from p_expected_draft_revision then
    raise exception 'store_design_conflict';
  end if;
  if store_design_private.is_store_design_document_valid(v_design.draft_document) is not true then
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

create or replace function store_design_private.rollback_store_design_published_internal(
  p_expected_published_revision bigint
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_design public.store_designs%rowtype;
begin
  if p_expected_published_revision is null or p_expected_published_revision < 1 then
    raise exception 'store_design_revision_invalid';
  end if;

  select sd.* into v_design
  from public.store_designs sd
  join public.shops s on s.id = sd.shop_id
  where s.owner_id = (select auth.uid())
  for update of sd;

  if not found then raise exception 'store_design_not_found'; end if;
  if v_design.published_revision is distinct from p_expected_published_revision then
    raise exception 'store_design_conflict';
  end if;
  if v_design.previous_published_document is null then
    raise exception 'store_design_previous_missing';
  end if;

  if store_design_private.is_store_design_document_valid(v_design.previous_published_document) is not true
     and store_design_private.is_legacy_store_theme_compatible(v_design.previous_published_document) is not true then
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

revoke all on function store_design_private.rollback_store_design_published_internal()
  from public, anon, authenticated;
revoke all on function store_design_private.rollback_store_design_published_internal(bigint)
  from public, anon, authenticated;
grant execute on function store_design_private.rollback_store_design_published_internal(bigint)
  to authenticated;

drop function if exists public.rollback_store_design_published();

create or replace function public.rollback_store_design_published(
  p_expected_published_revision bigint
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select store_design_private.rollback_store_design_published_internal(p_expected_published_revision);
$$;

revoke all on function public.rollback_store_design_published(bigint)
  from public, anon, authenticated;
grant execute on function public.rollback_store_design_published(bigint)
  to authenticated;

commit;
