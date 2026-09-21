import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('categories exclude nulls and inactive products',()=>{ const s=fs.readFileSync('api/storefront.ts','utf8'); assert.match(s,/select\('category'\).*eq\('shop_id', shop\.id\).*eq\('status', 'active'\).*not\('category', 'is', null\)/s); });
