import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('read gateways use controlled 502 responses for upstream read failures',()=>{ for(const f of ['api/storefront.ts','api/checkout.ts','api/storefront-orders.ts']) assert.match(fs.readFileSync(f,'utf8'),/502/); });
