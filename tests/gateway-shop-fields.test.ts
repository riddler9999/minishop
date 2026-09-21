import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public shop query selects narrow public field set',()=>assert.match(fs.readFileSync('api/storefront.ts','utf8'),/select\('id,name,logo_url,default_delivery_fee'\)/));
