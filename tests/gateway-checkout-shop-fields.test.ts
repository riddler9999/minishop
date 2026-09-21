import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout shop query selects only id and default fee',()=>assert.match(fs.readFileSync('api/checkout.ts','utf8'),/select\('id,default_delivery_fee'\)/));
