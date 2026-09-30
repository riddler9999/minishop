import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../supabase/migrations/0032_superadmin_pagination_aggregates.sql', import.meta.url), 'utf8');

test('Task 10 aggregate migration computes platform metrics in the database', () => {
  assert.match(sql, /create or replace function public\.superadmin_platform_metrics\(\)/i);
  assert.match(sql, /count\(\*\).*public\.shops/is);
  assert.match(sql, /shop_applications where status = 'pending'/i);
  assert.match(sql, /order_pack_purchases where status = 'pending'/i);
  assert.match(sql, /sum\(amount\).*shop_applications where status = 'approved'/is);
  assert.match(sql, /sum\(amount\).*order_pack_purchases where status = 'approved'/is);
});

test('Task 10 aggregate RPC is service-role only', () => {
  assert.match(sql, /security definer/i);
  assert.match(sql, /set search_path = public, pg_temp/i);
  assert.match(sql, /revoke all on function public\.superadmin_platform_metrics\(\) from authenticated/i);
  assert.match(sql, /grant execute on function public\.superadmin_platform_metrics\(\) to service_role/i);
});
