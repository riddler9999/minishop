import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Supabase client docs preserve slug-less demo boundary',()=>assert.match(fs.readFileSync('src/core/supabase/client.ts','utf8'),/slug-less root route/));
