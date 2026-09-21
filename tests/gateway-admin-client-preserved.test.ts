import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('seller browser client still persists and refreshes auth session',()=>{ const s=fs.readFileSync('src/core/supabase/client.ts','utf8'); assert.match(s,/persistSession: true/); assert.match(s,/autoRefreshToken: true/); });
