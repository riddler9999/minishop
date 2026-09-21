import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public gateway does not enable wildcard CORS',()=>{ for(const f of ['api/storefront.ts','api/checkout.ts','api/storefront-orders.ts']) assert.doesNotMatch(fs.readFileSync(f,'utf8'),/Access-Control-Allow-Origin|\*.*CORS/i); });
