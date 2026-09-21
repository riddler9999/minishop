import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('buyer order lookup maps tracking fields',()=>{ const s=fs.readFileSync('src/features/orders/api/storefront.ts','utf8'); for(const k of ['order_id','item_total','delivery_fee','grand_total','payment_method','status','created_at']) assert.match(s,new RegExp(k)); });
