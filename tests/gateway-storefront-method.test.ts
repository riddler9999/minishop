import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('storefront gateway allows GET and HEAD only', () => {
  const source = fs.readFileSync('api/storefront.ts', 'utf8');
  assert.match(source, /req\.method !== 'GET' && req\.method !== 'HEAD'/);
});
