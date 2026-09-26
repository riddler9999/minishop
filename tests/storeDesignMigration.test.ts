import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFile} from 'node:fs/promises';

const migrationPath = new URL('../supabase/migrations/0024_store_design_lifecycle.sql', import.meta.url);

describe('Store Design lifecycle migration contract', () => {
  it('creates one additive lifecycle row per shop without removing shops.theme', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    assert.match(sql, /create table if not exists public\.store_designs/i);
    assert.match(sql, /shop_id\s+uuid\s+primary key\s+references public\.shops\(id\)\s+on delete cascade/i);
    assert.match(sql, /draft_document\s+jsonb\s+not null/i);
    assert.match(sql, /published_document\s+jsonb\s+not null/i);
    assert.match(sql, /previous_published_document\s+jsonb/i);
    assert.match(sql, /draft_revision\s+bigint\s+not null\s+default 1/i);
    assert.match(sql, /published_revision\s+bigint\s+not null\s+default 1/i);

    assert.doesNotMatch(sql, /drop\s+column\s+(if\s+exists\s+)?theme/i);
    assert.match(sql, /insert into public\.store_designs[\s\S]*select[\s\S]*s\.theme/i);
    assert.match(sql, /on conflict \(shop_id\) do nothing/i);
  });

  it('uses optimistic revision checks for Draft save', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    assert.match(sql, /create or replace function public\.save_store_design_draft\(\s*p_expected_revision bigint,\s*p_document jsonb\s*\)/i);
    assert.match(sql, /for update/i);
    assert.match(sql, /v_design\.draft_revision\s*<>\s*p_expected_revision/i);
    assert.match(sql, /raise exception 'store_design_conflict'/i);
    assert.match(sql, /draft_revision\s*=\s*draft_revision\s*\+\s*1/i);
    assert.match(sql, /draft_document\s*=\s*p_document/i);
  });

  it('publishes and rolls back lifecycle slots atomically while row-locked', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    assert.match(sql, /create or replace function public\.publish_store_design_draft\(\s*p_expected_draft_revision bigint\s*\)/i);
    assert.match(sql, /previous_published_document\s*=\s*published_document/i);
    assert.match(sql, /published_document\s*=\s*draft_document/i);
    assert.match(sql, /published_revision\s*=\s*published_revision\s*\+\s*1/i);

    assert.match(sql, /create or replace function public\.rollback_store_design_published\(\)/i);
    assert.match(sql, /raise exception 'store_design_previous_missing'/i);
    assert.match(sql, /previous_published_document\s*=\s*v_design\.published_document/i);
    assert.match(sql, /published_document\s*=\s*v_design\.previous_published_document/i);
  });

  it('initializes future shops without overwriting legacy theme', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    assert.match(sql, /create or replace function store_design_private\.init_store_design_lifecycle\(\)/i);
    assert.match(sql, /new\.theme/i);
    assert.match(sql, /create trigger init_store_design_lifecycle_after_shop/i);
    assert.match(sql, /after insert on public\.shops/i);
    assert.match(sql, /revoke all on function store_design_private\.init_store_design_lifecycle\(\)/i);
  });
});
