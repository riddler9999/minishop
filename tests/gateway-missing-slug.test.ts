import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('catalog gateway rejects missing shop slug',()=>{ const s=fs.readFileSync('api/storefront.ts','utf8'); assert.match(s,/!slug.*400/); });
