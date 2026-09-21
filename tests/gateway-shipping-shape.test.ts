import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout config exposes zones and default fee',()=>{ const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/zones: zones \|\| \[\]/); assert.match(s,/defaultFee: shop\.default_delivery_fee/); });
