import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway preserves KBZPay and WavePay labels',()=>{ const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/KBZPay/); assert.match(s,/WavePay/); });
