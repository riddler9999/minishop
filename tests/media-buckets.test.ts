import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media proxy permits only the two public storefront buckets', () => {
  const source = fs.readFileSync('api/storefront/[...path].ts', 'utf8');
  assert.match(source, /product-images/);
  assert.match(source, /shop-logos/);
  assert.doesNotMatch(source, /shop-assets/);
});
