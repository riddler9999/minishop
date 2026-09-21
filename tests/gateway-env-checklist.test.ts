import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('deploy checklist verifies server env vars',()=>{ const s=fs.readFileSync('api/DEPLOY_CHECKLIST.md','utf8'); assert.match(s,/SUPABASE_URL/); assert.match(s,/SUPABASE_ANON_KEY/); });
