import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('network CI also runs on main',()=>assert.match(fs.readFileSync('.github/workflows/network-resilience.yml','utf8'),/branches: \[main\]/));
