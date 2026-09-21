import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout accounts and zones are tenant scoped',()=>{ const s=fs.readFileSync('api/checkout.ts','utf8'); const matches=s.match(/eq\('shop_id', shop\.id\)/g)||[]; assert.ok(matches.length>=2); });
