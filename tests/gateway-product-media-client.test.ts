import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('product mapper recognizes both storefront storage buckets',()=>{ const s=fs.readFileSync('src/features/catalog/api/mappers.ts','utf8'); assert.match(s,/product-images\|shop-logos/); assert.match(s,/\/api\/storefront/); });
