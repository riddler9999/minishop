import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('server mapper recognizes storefront storage buckets',()=>{ const s=fs.readFileSync('api/_map.ts','utf8'); assert.match(s,/product-images\|shop-logos/); assert.match(s,/\/api\/storefront/); });
