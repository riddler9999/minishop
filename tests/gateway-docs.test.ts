import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('deployment checklist includes health and buyer flow verification', () => {
  const doc = fs.readFileSync('api/DEPLOY_CHECKLIST.md','utf8');
  assert.match(doc, /\/api\/health/);
  assert.match(doc, /place a test order/i);
  assert.match(doc, /VPN on and once off/i);
});
