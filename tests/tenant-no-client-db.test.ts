import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public tenant resolver contains no direct database calls',()=>{ const s=fs.readFileSync('src/features/tenancy/shopResolver.ts','utf8'); assert.doesNotMatch(s,/\.from\(|\.rpc\(/); });
