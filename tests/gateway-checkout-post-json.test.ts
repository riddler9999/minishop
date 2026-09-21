import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('buyer checkout sends JSON POST to first-party endpoint',()=>{ const s=fs.readFileSync('src/features/checkout/api.ts','utf8'); assert.match(s,/fetch\('\/api\/checkout'/); assert.match(s,/method:'POST'/); assert.match(s,/Content-Type':'application\/json'/); });
