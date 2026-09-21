import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway sends sanitized product ids and quantities, not client prices',()=>{ const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/product_id: clean\(i\?\.id/); assert.match(s,/p_items: items/); assert.doesNotMatch(s,/p_price|shippingFee/); });
