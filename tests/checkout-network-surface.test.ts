import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('buyer checkout and order lookup avoid direct Supabase client', () => {
  for (const file of ['src/features/checkout/api.ts','src/features/orders/api/storefront.ts']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /requireSupabase/);
    assert.match(source, /\/api\//);
  }
});
