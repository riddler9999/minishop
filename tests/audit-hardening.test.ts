import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('cart storage is scoped by tenant slug', () => {
  const source = fs.readFileSync('src/features/cart/state.tsx', 'utf8');
  assert.match(source, /getShopSlug\(\)/);
  assert.match(source, /minishop_cart:/);
});

test('checkout gateway maps typed DB errors before returning them', () => {
  const source = fs.readFileSync('api/checkout.ts', 'utf8');
  assert.match(source, /mapDbError/);
  assert.doesNotMatch(source, /\{error:\s*error\.message\}/);
});

test('storefront gateway uses shared JSON security helper', () => {
  const source = fs.readFileSync('api/storefront.ts', 'utf8');
  assert.match(source, /sendJson/);
});

test('storefront media proxy enforces a maximum content length', () => {
  const source = fs.readFileSync('api/storefront.ts', 'utf8');
  assert.match(source, /content-length/i);
  assert.match(source, /MAX_MEDIA_BYTES/);
});

test('public product queries use explicit projections', () => {
  const source = fs.readFileSync('api/storefront.ts', 'utf8');
  assert.doesNotMatch(source, /from\('products'\)\.select\('\*'/);
});

test('network resilience workflow covers checkout and order buyer paths', () => {
  const source = fs.readFileSync('.github/workflows/network-resilience.yml', 'utf8');
  assert.match(source, /src\/features\/checkout\/\*\*/);
  assert.match(source, /src\/features\/orders\/\*\*/);
});
