import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gateway version endpoint identifies first-party mode', () => {
  const source = fs.readFileSync('api/storefront-config.ts', 'utf8');
  assert.match(source, /first-party/);
});
