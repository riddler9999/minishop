import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('all buyer data modules call relative same-origin API paths',()=>{ const files=['src/features/catalog/api/storefront.ts','src/features/tenancy/shopResolver.ts','src/features/checkout/api.ts','src/features/orders/api/storefront.ts']; for(const f of files){ const s=fs.readFileSync(f,'utf8'); assert.match(s,/fetch\(`?['"]?\/api\//); } });
