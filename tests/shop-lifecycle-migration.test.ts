import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {describe, it} from 'node:test';

const migrationPath = new URL('../supabase/migrations/0026_platform_shop_lifecycle.sql', import.meta.url);

describe('platform shop lifecycle migration', () => {
  it('separates seller intent from platform suspension while preserving the effective flag', async () => {
    const sql = await readFile(migrationPath, 'utf8');
    assert.match(sql, /add column if not exists seller_is_active boolean not null default true/i);
    assert.match(sql, /add column if not exists platform_suspended boolean not null default false/i);
    assert.match(sql, /new\.is_active\s*:=\s*new\.seller_is_active\s+and\s+not\s+new\.platform_suspended/i);
    assert.match(sql, /platform_suspension_is_platform_managed/i);
    assert.match(
      sql,
      /set\s+seller_is_active\s*=\s*true,\s*platform_suspended\s*=\s*not\s+is_active/i,
      'pre-migration inactive shops must remain platform-suspended after the split',
    );
  });

  it('replaces owner FOR ALL access with select, insert, and update only', async () => {
    const sql = await readFile(migrationPath, 'utf8');
    assert.match(sql, /drop policy if exists shops_owner_all on public\.shops/i);
    assert.match(sql, /create policy shops_owner_select[\s\S]*for select to authenticated/i);
    assert.match(sql, /create policy shops_owner_insert[\s\S]*for insert to authenticated/i);
    assert.match(sql, /create policy shops_owner_update[\s\S]*for update to authenticated/i);
    assert.doesNotMatch(sql, /create policy shops_owner_delete/i);
    assert.doesNotMatch(sql, /create policy shops_owner_all/i);
  });
});
