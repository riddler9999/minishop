import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('browser Supabase client documents RLS security boundary',()=>assert.match(fs.readFileSync('src/core/supabase/client.ts','utf8'),/Row Level Security/));
