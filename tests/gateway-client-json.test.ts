import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('buyer gateway clients consume JSON payloads',()=>{ for(const f of ['src/features/catalog/api/storefront.ts','src/features/checkout/api.ts','src/features/orders/api/storefront.ts','src/features/tenancy/shopResolver.ts']) assert.match(fs.readFileSync(f,'utf8'),/\.json\(\)/); });
