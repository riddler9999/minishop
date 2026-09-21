import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public gateways return 503 when backend env is absent',()=>{ for(const f of ['api/storefront.ts','api/checkout.ts','api/storefront-orders.ts']) assert.match(fs.readFileSync(f,'utf8'),/503/); });
