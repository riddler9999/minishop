import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gateway README documents first-party Supabase media rewrite',()=>{ const s=fs.readFileSync('api/README.md','utf8'); assert.match(s,/Supabase-hosted image URLs returned to buyers are rewritten through the first-party media proxy/); });
