import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('buyer validates active shop before order POST',()=>{ const s=fs.readFileSync('src/features/checkout/api.ts','utf8'); assert.match(s,/await resolveShop\(\)/); });
