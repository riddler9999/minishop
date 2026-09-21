import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('core first-party endpoints exist',()=>{ for(const f of ['api/storefront.ts','api/checkout.ts','api/storefront-orders.ts','api/health.ts','api/storefront/[...path].ts']) assert.equal(fs.existsSync(f),true,f); });
