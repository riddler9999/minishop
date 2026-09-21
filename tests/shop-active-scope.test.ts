import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public gateways resolve active shops only',()=>{ for(const f of ['api/storefront.ts','api/checkout.ts']) assert.match(fs.readFileSync(f,'utf8'),/eq\('is_active', true\)/); });
