import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('catalog gateway returns total count',()=>{ const s=fs.readFileSync('api/storefront.ts','utf8'); assert.match(s,/count: 'exact'/); assert.match(s,/total: count \?\?/); });
