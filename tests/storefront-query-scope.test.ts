import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('server catalog queries scope by shop and active status',()=>{ const s=fs.readFileSync('api/storefront.ts','utf8'); assert.match(s,/eq\('shop_id', shop\.id\)/); assert.match(s,/eq\('status', 'active'\)/); });
