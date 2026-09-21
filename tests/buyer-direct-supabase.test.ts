import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const buyerFiles = [
  'src/features/catalog/api/storefront.ts',
  'src/features/tenancy/shopResolver.ts',
  'src/features/checkout/api.ts',
  'src/features/orders/api/storefront.ts',
];

test('buyer network modules do not import Supabase client', () => {
  for (const file of buyerFiles) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /core\/supabase\/client|requireSupabase|getSupabase/);
  }
});
