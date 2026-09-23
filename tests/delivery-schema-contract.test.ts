import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const m13 = fs.readFileSync('supabase/migrations/0013_delivery_services.sql', 'utf8');
const m14 = fs.readFileSync('supabase/migrations/0014_ninjavan_production_pricing.sql', 'utf8');
const m16 = fs.readFileSync('supabase/migrations/0016_entitlements_and_pricing.sql', 'utf8');
const reconciliation = fs.readFileSync('supabase/delivery-schema-reconciliation.md', 'utf8');

test('delivery foundation migration defines the schema required by runtime consumers', () => {
  for (const column of ['origin_region', 'origin_township', 'delivery_service']) {
    assert.match(m13, new RegExp('\\b' + column + '\\b'));
  }
  assert.match(m13, /create table if not exists public\.ninjavan_rates/);
  assert.match(m13, /enable row level security/);
});

test('historical Ninja Van migration cannot be applied blindly after entitlement migration', () => {
  assert.match(m14, /create or replace function public\.place_order\([\s\S]*?p_items jsonb[\s\S]*?\) returns jsonb/);
  assert.doesNotMatch(m14, /p_idempotency_key uuid/);
  assert.match(m16, /p_idempotency_key uuid default gen_random_uuid\(\)/);
  assert.match(reconciliation, /would regress .*place_order.*10-argument.*older 9-argument/s);
});

test('reconciliation explicitly records production as migration-gated', () => {
  assert.match(reconciliation, /No production migration was applied/);
  assert.match(reconciliation, /explicitly approved before execution/);
  assert.match(reconciliation, /zero duplicate owners/);
});
