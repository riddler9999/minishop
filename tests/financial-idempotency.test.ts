import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const migration = fs.readFileSync('supabase/migrations/0031_financial_idempotency.sql', 'utf8');
const api = fs.readFileSync('api/superadmin.ts', 'utf8');

test('Task 8 requires immutable payment identity and request idempotency for financial grants', () => {
  assert.match(migration, /financial_admin_requests/);
  assert.match(migration, /financial_admin_requests_payment_identity_uidx/);
  assert.match(migration, /financial_admin_requests_idempotency_key_uidx/);
  assert.match(migration, /payment_identity_required/);
  assert.match(migration, /idempotency_key_required/);
});

test('Task 8 subscription RPCs require payment identity and idempotency key', () => {
  for (const fn of ['admin_activate_subscription','admin_renew_subscription','admin_upgrade_plan']) {
    const re = new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${fn}\\([\\s\\S]*?p_payment_identity\\s+text[\\s\\S]*?p_idempotency_key\\s+uuid`, 'i');
    assert.match(migration, re);
  }
});

test('Task 8 admin API forwards payment identity and idempotency key', () => {
  assert.match(api, /paymentIdentity/);
  assert.match(api, /idempotencyKey/);
  assert.match(api, /p_payment_identity/);
  assert.match(api, /p_idempotency_key/);
});
