\set ON_ERROR_STOP on

-- Runtime acceptance proof for migration 0024 against disposable PostgreSQL.
-- The workflow creates Supabase-like anon/authenticated roles + auth.uid() first,
-- then applies the real migration before executing this file.

-- Backfill created exactly one lifecycle row per existing Shop.
do $$
begin
  if (select count(*) from public.store_designs) <> 2 then
    raise exception 'expected two backfilled lifecycle rows';
  end if;
  if (select count(*) from public.shops where theme is not null) <> 2 then
    raise exception 'legacy shops.theme must remain untouched';
  end if;
end;
$$;

-- Seller 1: RLS exposes only own lifecycle row.
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

do $$
declare
  v_loaded jsonb;
  v_saved jsonb;
begin
  if (select count(*) from public.store_designs) <> 1 then
    raise exception 'seller1 RLS must expose exactly one lifecycle row';
  end if;

  if exists (
    select 1 from public.store_designs
    where shop_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid
  ) then
    raise exception 'seller1 must not read seller2 lifecycle';
  end if;

  v_loaded := public.load_own_store_design();
  if v_loaded->>'shop_id' <> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' then
    raise exception 'load_own_store_design resolved wrong shop';
  end if;

  v_saved := public.save_store_design_draft(
    1,
    '{
      "schemaVersion":1,
      "themeId":"dark-modern",
      "globalSettings":{"buyNow":{"label":"ဝယ်မည်","disabled":false}},
      "templates":{
        "home":{"sections":[]},
        "collection":{"sections":[]},
        "product":{"sections":[]}
      }
    }'::jsonb
  );

  if (v_saved->>'revision')::bigint <> 2 then
    raise exception 'first Draft save must increment revision to 2';
  end if;
end;
$$;

-- Delayed stale autosave must reject and preserve the newer Draft.
do $$
begin
  begin
    perform public.save_store_design_draft(
      1,
      '{
        "schemaVersion":1,
        "themeId":"soft-elegant",
        "globalSettings":{"buyNow":{"label":"ဝယ်မည်","disabled":false}},
        "templates":{
          "home":{"sections":[]},
          "collection":{"sections":[]},
          "product":{"sections":[]}
        }
      }'::jsonb
    );
    raise exception 'expected store_design_conflict';
  exception
    when others then
      if sqlerrm <> 'store_design_conflict' then
        raise;
      end if;
  end;

  if (select draft_revision from public.store_designs) <> 2 then
    raise exception 'stale save changed revision';
  end if;

  if (select draft_document->>'themeId' from public.store_designs) <> 'dark-modern' then
    raise exception 'stale save overwrote newer Draft';
  end if;
end;
$$;

-- Seller cannot bypass lifecycle RPCs with direct table mutation.
do $$
begin
  if has_table_privilege(current_user, 'public.store_designs', 'UPDATE') then
    raise exception 'authenticated seller unexpectedly has direct UPDATE privilege';
  end if;
end;
$$;

-- Buyer: no lifecycle table access and no seller RPC execution.
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);

do $$
declare
  v_public jsonb;
begin
  if has_table_privilege(current_user, 'public.store_designs', 'SELECT') then
    raise exception 'anon unexpectedly has lifecycle table SELECT';
  end if;
  if has_function_privilege(current_user, 'public.load_own_store_design()', 'EXECUTE') then
    raise exception 'anon unexpectedly can call seller lifecycle RPC';
  end if;
  if has_function_privilege(current_user, 'public.save_store_design_draft(bigint,jsonb)', 'EXECUTE') then
    raise exception 'anon unexpectedly can save Draft';
  end if;

  v_public := public.load_published_store_design('shop-one');
  if v_public->'document'->>'presetId' <> 'clean-minimal' then
    raise exception 'buyer must still see legacy Published while Draft is unpublished';
  end if;
  if v_public->'document' ? 'schemaVersion' then
    raise exception 'buyer saw Draft before Publish';
  end if;
end;
$$;

-- Publish is owner-resolved and atomically shifts Published -> Previous.
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

do $$
declare
  v_result jsonb;
begin
  v_result := public.publish_store_design_draft(2);

  if v_result->'published_document'->>'themeId' <> 'dark-modern' then
    raise exception 'Publish did not promote Draft';
  end if;
  if v_result->'previous_published_document'->>'presetId' <> 'clean-minimal' then
    raise exception 'Publish did not preserve previous Published';
  end if;
  if (v_result->>'published_revision')::bigint <> 2 then
    raise exception 'Publish did not increment published revision';
  end if;
end;
$$;

-- Buyer now sees the newly Published document, still through Published-only RPC.
reset role;
set role anon;
do $$
declare
  v_public jsonb;
begin
  v_public := public.load_published_store_design('shop-one');
  if v_public->'document'->>'themeId' <> 'dark-modern' then
    raise exception 'buyer did not receive new Published design';
  end if;
  if v_public ? 'draft_document' or v_public ? 'previous_published_document' then
    raise exception 'buyer RPC leaked private lifecycle slots';
  end if;
end;
$$;

-- Rollback is reversible: first restores legacy Published, second swaps back.
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

do $$
declare
  v_first jsonb;
  v_second jsonb;
begin
  v_first := public.rollback_store_design_published();
  if v_first->'published_document'->>'presetId' <> 'clean-minimal' then
    raise exception 'first rollback did not restore Previous Published';
  end if;

  v_second := public.rollback_store_design_published();
  if v_second->'published_document'->>'themeId' <> 'dark-modern' then
    raise exception 'second rollback did not reverse the first rollback';
  end if;
end;
$$;

-- Seller 2 remains isolated and resolves only its own Shop.
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);

do $$
declare
  v_loaded jsonb;
begin
  if (select count(*) from public.store_designs) <> 1 then
    raise exception 'seller2 RLS must expose exactly one lifecycle row';
  end if;

  v_loaded := public.load_own_store_design();
  if v_loaded->>'shop_id' <> 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' then
    raise exception 'seller2 resolved another tenant';
  end if;
end;
$$;

-- Simulate corrupted persisted Draft as DB owner. Publish must reject it and
-- leave the current Published slot unchanged (transactional failure safety).
reset role;
update public.store_designs
set draft_document = '{
  "schemaVersion":1,
  "themeId":"street-bold",
  "globalSettings":{"buyNow":{"label":"","disabled":true}},
  "templates":{
    "home":{"sections":[]},
    "collection":{"sections":[]},
    "product":{"sections":[]}
  }
}'::jsonb,
draft_revision = draft_revision + 1
where shop_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid;

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

do $$
begin
  begin
    perform public.publish_store_design_draft(3);
    raise exception 'expected store_design_invalid';
  exception
    when others then
      if sqlerrm <> 'store_design_invalid' then
        raise;
      end if;
  end;

  if (select published_document->>'themeId' from public.store_designs) <> 'dark-modern' then
    raise exception 'failed Publish mutated current Published';
  end if;
end;
$$;

reset role;
