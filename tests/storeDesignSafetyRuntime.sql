\set ON_ERROR_STOP on

-- Task 7 isolated runtime proof. Run after 0024 then 0028 in disposable PostgreSQL.

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

-- Invalid expected revisions are rejected explicitly.
do $$
declare
  v_doc jsonb := '{
    "schemaVersion":1,
    "themeId":"clean-minimal",
    "globalSettings":{"buyNow":{"label":"ဝယ်မည်","disabled":false}},
    "templates":{
      "home":{"sections":[]},
      "collection":{"sections":[]},
      "product":{"sections":[]}
    }
  }'::jsonb;
begin
  begin perform public.save_store_design_draft(null, v_doc); raise exception 'expected invalid revision'; exception when others then if sqlerrm is distinct from 'store_design_revision_invalid' then raise; end if; end;
  begin perform public.save_store_design_draft(0, v_doc); raise exception 'expected invalid revision'; exception when others then if sqlerrm is distinct from 'store_design_revision_invalid' then raise; end if; end;
  begin perform public.save_store_design_draft(-1, v_doc); raise exception 'expected invalid revision'; exception when others then if sqlerrm is distinct from 'store_design_revision_invalid' then raise; end if; end;
end;
$$;

-- Missing/null/wrong-type required fields reject.
do $$
declare
  v_base jsonb := '{
    "schemaVersion":1,
    "themeId":"clean-minimal",
    "globalSettings":{"buyNow":{"label":"ဝယ်မည်","disabled":false}},
    "templates":{
      "home":{"sections":[]},
      "collection":{"sections":[]},
      "product":{"sections":[]}
    }
  }'::jsonb;
  v_revision bigint;
  v_bad jsonb;
begin
  select draft_revision into v_revision from public.store_designs;
  foreach v_bad in array array[
    v_base - 'themeId',
    jsonb_set(v_base, '{themeId}', 'null'::jsonb),
    jsonb_set(v_base, '{themeId}', '12'::jsonb),
    v_base - 'globalSettings',
    jsonb_set(v_base, '{templates,home,sections}', '{}'::jsonb)
  ]
  loop
    begin
      perform public.save_store_design_draft(v_revision, v_bad);
      raise exception 'expected store_design_invalid';
    exception when others then
      if sqlerrm is distinct from 'store_design_invalid' then raise; end if;
    end;
  end loop;
end;
$$;

-- Oversized documents and excessive section counts reject at DB boundary.
do $$
declare
  v_revision bigint;
  v_base jsonb := '{
    "schemaVersion":1,
    "themeId":"clean-minimal",
    "globalSettings":{"buyNow":{"label":"ဝယ်မည်","disabled":false}},
    "templates":{
      "home":{"sections":[]},
      "collection":{"sections":[]},
      "product":{"sections":[]}
    }
  }'::jsonb;
  v_sections jsonb;
  v_large jsonb;
begin
  select draft_revision into v_revision from public.store_designs;

  select jsonb_agg(jsonb_build_object('id', 's-' || g, 'type', 'rich-text', 'enabled', true, 'settings', '{}'::jsonb))
  into v_sections
  from generate_series(1, 51) g;

  begin
    perform public.save_store_design_draft(v_revision, jsonb_set(v_base, '{templates,home,sections}', v_sections));
    raise exception 'expected section-limit rejection';
  exception when others then
    if sqlerrm is distinct from 'store_design_invalid' then raise; end if;
  end;

  v_large := jsonb_set(v_base, '{padding}', to_jsonb(repeat('x', 270000)));
  begin
    perform public.save_store_design_draft(v_revision, v_large);
    raise exception 'expected document-size rejection';
  exception when others then
    if sqlerrm is distinct from 'store_design_invalid' then raise; end if;
  end;
end;
$$;

-- Valid save/publish still works, stale save/publish and rollback retry reject.
do $$
declare
  v_doc jsonb := '{
    "schemaVersion":1,
    "themeId":"dark-modern",
    "globalSettings":{"buyNow":{"label":"ဝယ်မည်","disabled":false}},
    "templates":{
      "home":{"sections":[]},
      "collection":{"sections":[]},
      "product":{"sections":[]}
    }
  }'::jsonb;
  v_draft bigint;
  v_published bigint;
  v_result jsonb;
begin
  select draft_revision, published_revision into v_draft, v_published
  from public.store_designs
  where shop_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid;
  v_result := public.save_store_design_draft(v_draft, v_doc);

  begin
    perform public.save_store_design_draft(v_draft, v_doc);
    raise exception 'expected stale save conflict';
  exception when others then
    if sqlerrm is distinct from 'store_design_conflict' then raise; end if;
  end;

  v_draft := (v_result->>'revision')::bigint;
  v_result := public.publish_store_design_draft(v_draft);

  begin
    perform public.publish_store_design_draft(v_draft - 1);
    raise exception 'expected stale publish conflict';
  exception when others then
    if sqlerrm is distinct from 'store_design_conflict' then raise; end if;
  end;

  v_published := (v_result->>'published_revision')::bigint;
  perform public.rollback_store_design_published(v_published);

  begin
    perform public.rollback_store_design_published(v_published);
    raise exception 'expected rollback retry conflict';
  exception when others then
    if sqlerrm is distinct from 'store_design_conflict' then raise; end if;
  end;
end;
$$;

reset role;
