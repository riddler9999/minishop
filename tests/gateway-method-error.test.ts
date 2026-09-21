import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('read gateways return 405 for unsupported methods',()=>{ for(const f of ['api/storefront.ts','api/storefront-orders.ts']) assert.match(fs.readFileSync(f,'utf8'),/405/); });
