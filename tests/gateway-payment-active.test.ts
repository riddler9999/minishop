import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway exposes active payment accounts only',()=>assert.match(fs.readFileSync('api/checkout.ts','utf8'),/payment_accounts.*eq\('is_active', true\)/s));
