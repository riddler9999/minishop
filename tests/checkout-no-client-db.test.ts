import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('buyer checkout contains no direct database or RPC calls',()=>{ const s=fs.readFileSync('src/features/checkout/api.ts','utf8'); assert.doesNotMatch(s,/\.from\(|\.rpc\(/); });
