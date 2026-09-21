import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('CSP keeps Supabase allowed until seller auth BFF migration',()=>{ const s=fs.readFileSync('vercel.json','utf8'); assert.match(s,/connect-src 'self' https:\/\/\*\.supabase\.co wss:\/\/\*\.supabase\.co/); });
