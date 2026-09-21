import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('diagnostic endpoint exposes no environment values',()=>{ const s=fs.readFileSync('api/storefront-config.ts','utf8'); assert.doesNotMatch(s,/process\.env|SUPABASE/); });
