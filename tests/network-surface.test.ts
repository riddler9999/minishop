import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('buyer storefront catalog uses first-party API', () => {
  const catalog = fs.readFileSync('src/features/catalog/api/storefront.ts', 'utf8');
  const resolver = fs.readFileSync('src/features/tenancy/shopResolver.ts', 'utf8');
  assert.match(catalog, /\/api\/storefront/);
  assert.doesNotMatch(catalog, /requireSupabase/);
  assert.match(resolver, /\/api\/storefront/);
  assert.doesNotMatch(resolver, /requireSupabase/);
});

test('SPA fallback does not swallow API routes', () => {
  const config = fs.readFileSync('vercel.json', 'utf8');
  assert.match(config, /\(\?!api\/\|assets\/\)/);
});
