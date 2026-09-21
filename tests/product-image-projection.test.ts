import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public product projection includes every field required by mapProductRow', () => {
  const storefront = fs.readFileSync('api/storefront.ts', 'utf8');
  const match = storefront.match(/PUBLIC_PRODUCT_COLUMNS\s*=\s*'([^']+)'/);
  assert.ok(match, 'PUBLIC_PRODUCT_COLUMNS must exist');
  const columns = new Set(match[1].split(','));
  for (const field of ['images', 'size', 'created_at']) {
    assert.ok(columns.has(field), `public product projection is missing ${field}`);
  }
});
