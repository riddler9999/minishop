import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('browser Supabase client still uses public anon env only',()=>{ const s=fs.readFileSync('src/core/supabase/client.ts','utf8'); assert.match(s,/VITE_SUPABASE_ANON_KEY/); assert.doesNotMatch(s,/SERVICE/); });
