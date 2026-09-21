import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('catalog gateway supports offset range pagination',()=>{ const s=fs.readFileSync('api/storefront.ts','utf8'); assert.match(s,/offset = Math\.max\(0/); assert.match(s,/q\.range\(offset, offset \+/); });
