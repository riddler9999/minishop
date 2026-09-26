import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFile} from 'node:fs/promises';

const migrationPath = new URL('../supabase/migrations/0024_store_design_lifecycle.sql', import.meta.url);

describe('Store Design RLS and RPC security contract', () => {
  it('enables RLS and permits only owning seller to select lifecycle rows', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    assert.match(sql, /alter table public\.store_designs enable row level security/i);
    assert.match(sql, /create policy store_designs_owner_select[\s\S]*for select to authenticated[\s\S]*s\.id\s*=\s*shop_id[\s\S]*s\.owner_id\s*=\s*\(select auth\.uid\(\)\)/i);
    assert.doesNotMatch(sql, /create policy store_designs_owner_(insert|update|delete|all)/i);
    assert.match(sql, /revoke all on table public\.store_designs from anon, authenticated/i);
    assert.match(sql, /grant select on table public\.store_designs to authenticated/i);
  });

  it('seller lifecycle RPCs resolve ownership from auth.uid and accept no shop id', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    assert.match(sql, /create or replace function public\.load_own_store_design\(\)/i);
    assert.match(sql, /create or replace function public\.save_store_design_draft\(p_expected_revision bigint, p_document jsonb\)/i);
    assert.match(sql, /create or replace function public\.publish_store_design_draft\(p_expected_draft_revision bigint\)/i);
    assert.match(sql, /create or replace function public\.rollback_store_design_published\(\)/i);
    assert.doesNotMatch(sql, /save_store_design_draft\([^)]*shop_id/i);
    assert.doesNotMatch(sql, /publish_store_design_draft\([^)]*shop_id/i);
    assert.doesNotMatch(sql, /rollback_store_design_published\([^)]*shop_id/i);
    assert.match(sql, /s\.owner_id\s*=\s*\(select auth\.uid\(\)\)/i);
  });

  it('keeps privileged implementations out of the exposed public schema', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    assert.match(sql, /create schema if not exists store_design_private/i);
    assert.match(sql, /create or replace function store_design_private\.save_store_design_draft_internal/i);
    assert.match(sql, /security definer\s+set search_path = ''/i);
    assert.match(sql, /create or replace function public\.save_store_design_draft\(p_expected_revision bigint, p_document jsonb\)[\s\S]*security invoker/i);
    const publicSave = sql.match(/create or replace function public\\.save_store_design_draft\\(p_expected_revision bigint, p_document jsonb\\)([\\s\\S]*?)\\$\\$;/i);\n    assert.ok(publicSave);\n    assert.doesNotMatch(publicSave[1], /security definer/i);

    assert.match(sql, /revoke all on function public\.load_own_store_design\(\) from public, anon, authenticated/i);
    assert.match(sql, /grant execute on function public\.load_own_store_design\(\) to authenticated/i);
    assert.match(sql, /revoke all on function public\.save_store_design_draft\(bigint,jsonb\) from public, anon, authenticated/i);
    assert.match(sql, /grant execute on function public\.save_store_design_draft\(bigint,jsonb\) to authenticated/i);
    assert.match(sql, /revoke all on function public\.publish_store_design_draft\(bigint\) from public, anon, authenticated/i);
    assert.match(sql, /grant execute on function public\.publish_store_design_draft\(bigint\) to authenticated/i);
    assert.match(sql, /revoke all on function public\.rollback_store_design_published\(\) from public, anon, authenticated/i);
    assert.match(sql, /grant execute on function public\.rollback_store_design_published\(\) to authenticated/i);
  });

  it('exposes buyer Published only and never Draft or Previous Published', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    assert.match(sql, /create or replace function public\.load_published_store_design\(p_shop_slug text\)/i);
    assert.match(sql, /s\.slug\s*=\s*p_shop_slug/i);
    assert.match(sql, /s\.is_active\s*=\s*true/i);

    const match = sql.match(/create or replace function public\.load_published_store_design\(p_shop_slug text\)([\s\S]*?)\$\$;/i);
    assert.ok(match, 'expected published-only buyer function');
    const body = match[1];
    assert.match(body, /published_document/i);
    assert.doesNotMatch(body, /draft_document/i);
    assert.doesNotMatch(body, /previous_published_document/i);

    assert.match(sql, /grant execute on function public\.load_published_store_design\(text\) to anon, authenticated/i);
  });

  it('validates v1 schema and protected Buy Now before Draft persistence or Publish', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    assert.match(sql, /create or replace function store_design_private\.is_store_design_document_valid\(p_document jsonb\)/i);
    assert.match(sql, /p_document->>'schemaVersion'\s*=\s*'1'/i);
    assert.match(sql, /globalSettings[\s\S]*buyNow[\s\S]*label/i);
    assert.match(sql, /globalSettings[\s\S]*buyNow[\s\S]*disabled/i);
    assert.match(sql, /raise exception 'store_design_invalid'/i);
  });
});
