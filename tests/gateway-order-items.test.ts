import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway maps items to product_id and qty',()=>{const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/product_id: clean\(i\?\.id/); assert.match(s,/qty: Math\.min/); assert.match(s,/p_items: items/);});
