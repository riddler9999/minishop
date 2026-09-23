import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  'supabase/migrations/0018_production_safe_delivery_reconciliation.sql',
  'utf8',
);

test('reconciliation adds missing delivery schema safely', () => {
  assert.match(sql, /add column if not exists origin_region text/);
  assert.match(sql, /add column if not exists origin_township text/);
  assert.match(sql, /add column if not exists delivery_service text not null default 'custom'/);
  assert.match(sql, /create table if not exists public\.ninjavan_rates/);
  assert.match(sql, /alter table public\.ninjavan_rates enable row level security/);
});

test('reconciliation preserves 10-argument idempotent entitlement place_order', () => {
  assert.match(sql, /p_idempotency_key uuid default null/);
  assert.match(sql, /private\.enforce_rate_limit\('place_order'/);
  assert.match(sql, /where shop_id = v_shop\.id for update/);
  assert.match(sql, /orders_shop_idempotency_uniq/);
  assert.match(sql, /event_type, monthly_delta, order_id/);
  assert.match(sql, /event_type, purchased_delta, order_id/);
});

test('reconciliation composes server-side delivery pricing into place_order', () => {
  assert.match(sql, /v_delivery := public\.resolve_delivery_fee\(v_shop\.id, p_region, p_township\)/);
  assert.match(sql, /delivery_service, origin_township, idempotency_key/);
  assert.match(sql, /v_shop\.delivery_service, v_shop\.origin_township, p_idempotency_key/);
  assert.match(sql, /'delivery_service', v_shop\.delivery_service/);
});

test('delivery objects use explicit RLS and least-privilege grants', () => {
  assert.match(sql, /revoke all on table public\.ninjavan_rates from public, anon, authenticated/);
  assert.match(sql, /grant select on table public\.ninjavan_rates to anon, authenticated/);
  assert.match(sql, /create policy ninjavan_rates_public_read[\s\S]*for select to anon, authenticated/);
  assert.match(sql, /revoke all on function public\.resolve_delivery_fee\(uuid,text,text\)[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.resolve_delivery_fee\(uuid,text,text\)[\s\S]*to service_role/);
});

test('migration does not seed production rates', () => {
  assert.doesNotMatch(sql, /Supplied Ninja Van Myanmar coverage chart/);
  assert.doesNotMatch(sql, /insert into public\.ninjavan_rates/);
});
