import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('lookup gateway maps slug order number and phone to RPC',()=>{ const s=fs.readFileSync('api/storefront-orders.ts','utf8'); for(const k of ['p_shop_slug: slug','p_order_no: orderNo','p_phone: phone']) assert.match(s,new RegExp(k)); });
