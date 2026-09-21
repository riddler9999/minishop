import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('catalog client builds encoded URLSearchParams',()=>{ const s=fs.readFileSync('src/features/catalog/api/storefront.ts','utf8'); assert.match(s,/new URLSearchParams\(\{slug\}\)/); assert.match(s,/qs\.set/); });
