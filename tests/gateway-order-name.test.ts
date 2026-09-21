import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway maps customer name',()=>assert.match(fs.readFileSync('api/checkout.ts','utf8'),/p_customer_name: b\.customer\?\.name/));
