import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('shared JSON helper caches only successful responses and keeps errors private', () => {
  const http = fs.readFileSync('api/_http.ts', 'utf8');
  assert.match(http, /cache && status === 200/);
  assert.match(http, /: 'no-store'/);
  const storefront = fs.readFileSync('api/storefront.ts', 'utf8');
  assert.match(storefront, /sendJson/);
});
