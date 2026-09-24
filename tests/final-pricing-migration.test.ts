import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const sql = readFileSync(
  new URL('../supabase/migrations/0021_final_pricing_packaging_reconciliation.sql', import.meta.url),
  'utf8',
);

test('final pricing migration reconciles Business quota to 200 without resetting existing usage', () => {
  assert.match(sql, /when 'business' then 200/);
  assert.match(sql, /when 'starter' then 60/);
  const existingUpdate = sql.slice(sql.indexOf('update public.shop_entitlements'), sql.indexOf('-- New shops'));
  assert.doesNotMatch(existingUpdate, /monthly_used\s*=/);
  assert.doesNotMatch(existingUpdate, /purchased_balance\s*=/);
});

test('final pricing migration enforces total product caps', () => {
  assert.match(sql, /when 'business' then 500/);
  assert.match(sql, /when 'starter' then 100/);
  assert.match(sql, /else 10/);
  assert.match(sql, /select count\(\*\) into v_count[\s\S]*from public\.products[\s\S]*where shop_id = new\.shop_id/);
});

test('product cap serializes concurrent creates per shop before counting rows', () => {
  const start = sql.indexOf('create or replace function public.enforce_product_limit()');
  const end = sql.indexOf('-- Basic promotions are Core', start);
  const productLimit = sql.slice(start, end);
  const lockIndex = productLimit.search(/from public\.shops[\s\S]*for update/);
  const countIndex = productLimit.indexOf('select count(*) into v_count');
  assert.ok(lockIndex >= 0, 'shop row must be locked FOR UPDATE');
  assert.ok(countIndex > lockIndex, 'shop lock must happen before product count');
});

test('basic promotions are no longer Business-gated in the database', () => {
  assert.match(sql, /drop trigger if exists products_enforce_plan/);
  assert.match(sql, /drop function if exists public\.enforce_product_plan/);
});

test('created-order usage ignores seller cancellation state', () => {
  const start = sql.indexOf('create or replace view public.shop_monthly_usage');
  const end = sql.indexOf('-- Payment-proof auto activation', start);
  const usage = sql.slice(start, end);
  assert.match(usage, /o\.is_test = false/);
  assert.match(usage, /o\.is_duplicate = false/);
  assert.doesNotMatch(usage, /status\s*<>\s*'cancelled'/);
  assert.doesNotMatch(usage, /o\.is_billable/);
});

test('payment proof activation accepts only final paid prices', () => {
  assert.match(sql, /p_amount not in \(29000, 79000\)/);
  assert.match(sql, /p_amount = 29000/);
});
