import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('seller ownership resolution remains authenticated through Supabase client',()=>{ const s=fs.readFileSync('src/features/tenancy/ownShop.ts','utf8'); assert.match(s,/requireSupabase/); assert.match(s,/auth\.getUser/); });
