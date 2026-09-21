import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('architecture documents browser to Vercel to Supabase topology',()=>assert.match(fs.readFileSync('api/NETWORK_RESILIENCE.md','utf8'),/Browser -> Vercel domain -> \/api\/\* -> Supabase/));
