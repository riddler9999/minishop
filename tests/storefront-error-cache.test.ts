import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('storefront helper caches only HTTP 200',()=>{ const s=fs.readFileSync('api/storefront.ts','utf8'); assert.match(s,/status === 200 \? 'public/); assert.match(s,/: 'no-store'/); });
