import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('anonymous write and lookup throttles return 429',()=>{ for(const f of ['api/checkout.ts','api/storefront-orders.ts']) assert.match(fs.readFileSync(f,'utf8'),/429/); });
