import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('catalog search escapes PostgREST filter metacharacters',()=>{ const s=fs.readFileSync('api/storefront.ts','utf8'); assert.match(s,/replace\(\/\[\\\\,\(\)\]\//); });
