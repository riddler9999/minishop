import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public checkout configuration opts into edge cache',()=>{ const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/defaultFee: shop\.default_delivery_fee\}, true/); });
