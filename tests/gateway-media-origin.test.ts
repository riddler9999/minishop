import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media proxy origin comes from Supabase env',()=>{ const s=fs.readFileSync('api/storefront/[...path].ts','utf8'); assert.match(s,/SUPABASE_URL/); assert.match(s,/VITE_SUPABASE_URL/); });
