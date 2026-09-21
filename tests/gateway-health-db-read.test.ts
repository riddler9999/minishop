import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('health database probe selects id and limits one row',()=>{ const s=fs.readFileSync('api/health.ts','utf8'); assert.match(s,/select\('id'\)\.limit\(1\)/); });
