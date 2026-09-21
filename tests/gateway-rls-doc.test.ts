import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('architecture explicitly protects RLS semantics',()=>assert.match(fs.readFileSync('api/NETWORK_RESILIENCE.md','utf8'),/must not weaken RLS/));
