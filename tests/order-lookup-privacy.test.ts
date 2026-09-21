import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('order lookup requires slug, order number and phone',()=>{ const s=fs.readFileSync('api/storefront-orders.ts','utf8'); assert.match(s,/!slug \|\| !orderNo \|\| !phone/); });
