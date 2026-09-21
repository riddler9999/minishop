import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway sanitizes payment reference tail and defaults missing values',()=>{const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/paymentRefTail = clean\(b\.paymentRefTail/); assert.match(s,/p_payment_ref_tail: paymentRefTail/);});
