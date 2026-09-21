import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public media proxy never sends Supabase credentials',()=>{ const s=fs.readFileSync('api/storefront/[...path].ts','utf8'); assert.doesNotMatch(s,/ANON_KEY|apikey|Authorization/i); });
