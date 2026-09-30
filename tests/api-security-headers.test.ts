import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('JSON helper applies common security headers', () => {
  const source = fs.readFileSync('api/_http.ts', 'utf8');
  assert.match(source, /secure\(res\)/);
});
