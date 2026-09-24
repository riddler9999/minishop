import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  'supabase/migrations/0022_production_db_hardening.sql',
  'utf8',
);

test('trigger-only entitlement initializer is not API-callable', () => {
  assert.match(
    sql,
    /revoke all on function public\.init_shop_entitlement\(\)[\s\S]*from public, anon, authenticated/i,
  );
});

test('entitlement ledger order foreign key gets a covering partial index', () => {
  assert.match(
    sql,
    /create index if not exists entitlement_ledger_order_id_idx[\s\S]*on public\.entitlement_ledger \(order_id\)[\s\S]*where order_id is not null/i,
  );
});

test('hardening is additive and non-destructive', () => {
  assert.doesNotMatch(sql, /\bdrop table\b/i);
  assert.doesNotMatch(sql, /\btruncate\b/i);
  assert.doesNotMatch(sql, /\bdelete from\b/i);
});
