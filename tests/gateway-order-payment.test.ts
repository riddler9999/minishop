import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway maps sanitized payment method',()=>{const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/paymentMethod = clean\(b\.paymentMethod/); assert.match(s,/p_payment_method: paymentMethod/);});
