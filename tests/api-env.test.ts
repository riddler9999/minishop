import test from 'node:test';
import assert from 'node:assert/strict';
import {supabaseEnv} from '../api/_env.ts';

test('server gateway accepts non-VITE Supabase env names', () => {
  const oldUrl = process.env.SUPABASE_URL, oldKey = process.env.SUPABASE_ANON_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co'; process.env.SUPABASE_ANON_KEY = 'anon';
  assert.deepEqual(supabaseEnv(), {url:'https://example.supabase.co', key:'anon'});
  if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl;
  if (oldKey === undefined) delete process.env.SUPABASE_ANON_KEY; else process.env.SUPABASE_ANON_KEY = oldKey;
});
