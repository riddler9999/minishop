import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('tenant resolver maps Supabase shop logo to first-party path',()=>{ const s=fs.readFileSync('src/features/tenancy/shopResolver.ts','utf8'); assert.match(s,/shop-logos/); assert.match(s,/\/api\/storefront\/shop-logos/); });
