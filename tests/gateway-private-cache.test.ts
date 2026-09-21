import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('JSON helper defaults to no-store',()=>{ const s=fs.readFileSync('api/_http.ts','utf8'); assert.match(s,/: 'no-store'/); assert.match(s,/cache = false/); });
