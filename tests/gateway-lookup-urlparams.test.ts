import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('order lookup client builds encoded URLSearchParams',()=>assert.match(fs.readFileSync('src/features/orders/api/storefront.ts','utf8'),/new URLSearchParams\(\{slug, orderNo, phone\}\)/));
