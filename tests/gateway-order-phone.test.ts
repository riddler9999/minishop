import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway maps sanitized customer phone to RPC',()=>{const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/phone: clean\(b\.customer\?\.phone/); assert.match(s,/p_customer_phone: customer\.phone/);});
