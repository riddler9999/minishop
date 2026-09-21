import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('catalog gateway is read only',()=>assert.match(fs.readFileSync('api/storefront.ts','utf8'),/req\.method !== 'GET'/));
test('order lookup gateway is read only',()=>assert.match(fs.readFileSync('api/storefront-orders.ts','utf8'),/req\.method !== 'GET'/));
