import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('browser Supabase client remains optional for demo surface',()=>{ const s=fs.readFileSync('src/core/supabase/client.ts','utf8'); assert.match(s,/returns null when env is absent/); assert.match(s,/if \(!isSupabaseConfigured\) return null/); });
