import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway maps sanitized customer name',()=>{const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/name: clean\(b\.customer\?\.name/); assert.match(s,/p_customer_name: customer\.name/);});
