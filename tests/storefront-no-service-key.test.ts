import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public gateway never references privileged key names',()=>{ for(const f of ['api/storefront.ts','api/checkout.ts','api/storefront-orders.ts','api/health.ts']) assert.doesNotMatch(fs.readFileSync(f,'utf8'),/service.?role|secret.?key/i); });
