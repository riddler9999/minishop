import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway sends product ids and quantities, not client prices',()=>{ const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/product_id:i\.id, qty:i\.qty/); assert.doesNotMatch(s,/p_price|shippingFee/); });
