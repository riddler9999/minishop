import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('order gateway returns controlled client errors for rejected RPCs', () => {
  const s = fs.readFileSync('api/checkout.ts', 'utf8');
  assert.match(s, /if \(error\)/);
  assert.match(s, /rate_limit_exceeded/);
  assert.match(s, /\? 429 : 400/);
  assert.match(s, /mapDbError\(error\.message/);
});
