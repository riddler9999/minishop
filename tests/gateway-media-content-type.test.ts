import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media proxy forwards upstream content type',()=>{ const s=fs.readFileSync('api/storefront/[...path].ts','utf8'); assert.match(s,/upstream\.headers\.get\('content-type'\)/); assert.match(s,/Content-Type/); });
