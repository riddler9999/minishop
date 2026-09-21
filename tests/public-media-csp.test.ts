import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('CSP still permits legacy Supabase images during data migration',()=>{ const s=fs.readFileSync('vercel.json','utf8'); assert.match(s,/img-src 'self' data: blob: https:\/\/\*\.supabase\.co/); });
