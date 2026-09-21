import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('buyer modules need no API base URL environment variable',()=>{ for(const f of ['src/features/catalog/api/storefront.ts','src/features/checkout/api.ts','src/features/orders/api/storefront.ts','src/features/tenancy/shopResolver.ts']) assert.doesNotMatch(fs.readFileSync(f,'utf8'),/API_URL|API_BASE|BASE_URL/); });
