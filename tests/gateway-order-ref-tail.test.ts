import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway defaults missing payment reference tail to empty string',()=>assert.match(fs.readFileSync('api/checkout.ts','utf8'),/p_payment_ref_tail: b\.paymentRefTail \|\| ''/));
