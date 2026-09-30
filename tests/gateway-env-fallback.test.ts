import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('server env helper supports existing VITE names during rollout',()=>{ const s=fs.readFileSync('api/_env.ts','utf8'); assert.match(s,/VITE_SUPABASE_URL/); assert.match(s,/VITE_SUPABASE_ANON_KEY/); });
