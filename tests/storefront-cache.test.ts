import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public storefront reads use edge cache',()=>{ const s=fs.readFileSync('api/storefront.ts','utf8'); assert.match(s,/stale-while-revalidate=300/); });
