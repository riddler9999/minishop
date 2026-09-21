import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('architecture documents direct seller auth boundary',()=>{ const s=fs.readFileSync('api/NETWORK_RESILIENCE.md','utf8'); assert.match(s,/Seller dashboard authentication\/admin operations remain direct Supabase traffic/); });
