import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gateway docs list required server environment',()=>{ const s=fs.readFileSync('api/README.md','utf8'); assert.match(s,/SUPABASE_URL/); assert.match(s,/SUPABASE_ANON_KEY/); });
