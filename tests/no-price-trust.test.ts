import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway sends sanitized product ids and quantities, not client prices', () => {
  const input = fs.readFileSync('api/checkout-input.ts', 'utf8');
  const gateway = fs.readFileSync('api/checkout.ts', 'utf8');
  assert.match(input, /product_id:\s*clean\(item\?\.id/);
  assert.match(input, /qty:\s*Math\.min/);
  assert.match(gateway, /p_items:\s*input\.items/);
  assert.doesNotMatch(gateway, /p_price|shippingFee/);
});
