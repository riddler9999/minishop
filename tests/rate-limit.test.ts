import test from 'node:test';
import assert from 'node:assert/strict';
import {rateLimit} from '../api/_rate-limit.ts';

test('rate limiter rejects requests over limit in a window', () => {
  const req = {headers:{'x-forwarded-for':'203.0.113.9'}};
  assert.equal(rateLimit(req, 2, 60000), true);
  assert.equal(rateLimit(req, 2, 60000), true);
  assert.equal(rateLimit(req, 2, 60000), false);
});
