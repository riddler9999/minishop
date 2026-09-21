import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public live APIs still require a tenant slug',()=>{ for(const f of ['src/features/catalog/api/storefront.ts','src/features/checkout/api.ts','src/features/orders/api/storefront.ts']) assert.match(fs.readFileSync(f,'utf8'),/getShopSlug/); });
