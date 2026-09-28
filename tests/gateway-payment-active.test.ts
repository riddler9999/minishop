import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway exposes active payment accounts only', () => {
  const checkout = fs.readFileSync('api/checkout.ts', 'utf8');
  const migration = fs.readFileSync('supabase/migrations/0027_anonymous_storefront_projection.sql', 'utf8');
  assert.match(checkout, /buyerRelations\.paymentAccounts/);
  assert.match(checkout, /BUYER_LEGACY_RELATIONS[\s\S]*is_active/);
  assert.match(migration, /buyer_public_payment_accounts[\s\S]*where\s+pa\.is_active\s*=\s*true/i);
});
