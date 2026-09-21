import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const files=['src/features/catalog/api/storefront.ts','src/features/tenancy/shopResolver.ts','src/features/checkout/api.ts','src/features/orders/api/storefront.ts'];
test('buyer modules contain no supabase.co destination',()=>{ for(const f of files) assert.doesNotMatch(fs.readFileSync(f,'utf8'),/supabase\.co/i); });
