import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('health endpoint checks database path without service role', () => {
  const source = fs.readFileSync('api/health.ts', 'utf8');
  assert.match(source, /BUYER_SAFE_RELATIONS\.shops/);
  assert.match(source, /BUYER_LEGACY_RELATIONS\.shops/);
  assert.match(source, /isMissingBuyerProjection/);
  assert.doesNotMatch(source, /service[_-]?role/i);
});
