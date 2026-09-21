import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('product detail is scoped to id tenant and active status',()=>{ const s=fs.readFileSync('api/storefront.ts','utf8'); assert.match(s,/eq\('id', id\).*eq\('shop_id', shop\.id\).*eq\('status', 'active'\)/s); });
