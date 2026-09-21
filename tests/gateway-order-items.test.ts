import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway maps items to product_id and qty',()=>assert.match(fs.readFileSync('api/checkout.ts','utf8'),/\{product_id:i\.id, qty:i\.qty\}/));
