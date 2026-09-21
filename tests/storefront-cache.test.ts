import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public storefront reads opt into shared edge cache', () => {
  const storefront = fs.readFileSync('api/storefront.ts', 'utf8');
  const http = fs.readFileSync('api/_http.ts', 'utf8');
  assert.match(storefront, /sendJson\(res, 200,[\s\S]*, true\)/);
  assert.match(http, /stale-while-revalidate=300/);
});
