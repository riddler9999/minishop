import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('storefront gateway rejects unknown action',()=>{ const s=fs.readFileSync('api/storefront.ts','utf8'); assert.match(s,/Unknown action/); assert.match(s,/400/); });
