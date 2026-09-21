import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('anonymous gateway does not implement seller auth',()=>{ for(const f of ['api/storefront.ts','api/checkout.ts','api/storefront-orders.ts']) assert.doesNotMatch(fs.readFileSync(f,'utf8'),/signIn|signOut|auth\.getUser/); });
