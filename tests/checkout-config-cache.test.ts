import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public checkout configuration includes delivery config and opts into edge cache', () => {
  const s = fs.readFileSync('api/checkout.ts', 'utf8');
  assert.match(s, /defaultFee:\s*shop\.default_delivery_fee/);
  assert.match(s, /deliveryService:\s*shop\.delivery_service/);
  assert.match(s, /origin:\s*\{region:\s*shop\.origin_region,\s*township:\s*shop\.origin_township\}/);
  assert.match(s, /return sendJson\([\s\S]*?res,[\s\S]*?200,[\s\S]*?true[\s\S]*?\)/);
});
