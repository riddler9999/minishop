import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('architecture documents transitional CSP Supabase allowance',()=>assert.match(fs.readFileSync('api/NETWORK_RESILIENCE.md','utf8'),/CSP therefore still permits Supabase connections and images/));
