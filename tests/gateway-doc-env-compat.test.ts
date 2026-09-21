import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gateway docs document VITE env compatibility',()=>{ const s=fs.readFileSync('api/README.md','utf8'); assert.match(s,/VITE_SUPABASE_URL/); assert.match(s,/VITE_SUPABASE_ANON_KEY/); });
