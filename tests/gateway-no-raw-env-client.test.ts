import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('buyer modules contain no environment credential references',()=>{ for(const f of ['src/features/catalog/api/storefront.ts','src/features/checkout/api.ts','src/features/orders/api/storefront.ts','src/features/tenancy/shopResolver.ts']) assert.doesNotMatch(fs.readFileSync(f,'utf8'),/SUPABASE_|import\.meta\.env/); });
