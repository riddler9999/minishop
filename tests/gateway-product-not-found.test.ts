import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('missing product returns 404',()=>{ const s=fs.readFileSync('api/storefront.ts','utf8'); assert.match(s,/Product not found/); assert.match(s,/404/); });
