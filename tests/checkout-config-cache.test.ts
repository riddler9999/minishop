import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public checkout configuration includes delivery config and opts into edge cache',()=>{
  const s=fs.readFileSync('api/checkout.ts','utf8');
  assert.match(s,/defaultFee: shop\.default_delivery_fee, deliveryService: shop\.delivery_service, origin: \{region: shop\.origin_region, township: shop\.origin_township\}\}, true/);
});
