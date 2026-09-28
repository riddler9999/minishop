import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public gateways resolve active shops only', () => {
  const migration = fs.readFileSync('supabase/migrations/0027_anonymous_storefront_projection.sql', 'utf8');
  assert.match(migration, /buyer_public_shops[\s\S]*from\s+public\.shops[\s\S]*where\s+is_active\s*=\s*true/i);
  for (const file of ['api/storefront.ts', 'api/checkout.ts']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /BUYER_SAFE_RELATIONS/);
    assert.match(source, /BUYER_LEGACY_RELATIONS/);
    assert.match(source, /isMissingBuyerProjection/);
    assert.match(source, /eq\('is_active', true\)/);
  }
});
