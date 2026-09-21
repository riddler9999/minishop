import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway calls place_order with database RPC parameter names', () => {
  const source = fs.readFileSync('api/checkout.ts', 'utf8');
  for (const key of ['p_shop_slug','p_customer_name','p_customer_phone','p_street','p_region','p_township','p_payment_method','p_payment_ref_tail','p_items']) assert.match(source, new RegExp(key));
});
