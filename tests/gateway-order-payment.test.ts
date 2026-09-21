import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway maps payment method',()=>assert.match(fs.readFileSync('api/checkout.ts','utf8'),/p_payment_method: b\.paymentMethod/));
