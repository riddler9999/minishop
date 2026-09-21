import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('buyer modules expose friendly errors instead of raw backend errors',()=>{ const c=fs.readFileSync('src/features/catalog/api/storefront.ts','utf8'); const o=fs.readFileSync('src/features/orders/api/storefront.ts','utf8'); assert.match(c,/ပစ္စည်းအချက်အလက်/); assert.match(o,/Order ရှာမတွေ့ပါ/); });
