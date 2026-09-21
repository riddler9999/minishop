import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public shop gateway returns domain field names',()=>{ const s=fs.readFileSync('api/storefront.ts','utf8'); for(const k of ['id: shop.id','name: shop.name','logoUrl: media','defaultDeliveryFee']) assert.match(s,new RegExp(k.replace('.','\\.'))); });
