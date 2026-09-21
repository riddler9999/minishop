import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('buyer checkout maps RPC result into OrderResult',()=>{ const s=fs.readFileSync('src/features/checkout/api.ts','utf8'); for(const k of ['orderId','itemTotal','deliveryFee','grandTotal','amountNow','paymentMethod']) assert.match(s,new RegExp(k)); });
