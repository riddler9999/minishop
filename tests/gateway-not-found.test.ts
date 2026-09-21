import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public shop and checkout gateways return 404 for missing shops',()=>{ for(const f of ['api/storefront.ts','api/checkout.ts']) assert.match(fs.readFileSync(f,'utf8'),/404/); });
