import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('network CI watches tests',()=>assert.match(fs.readFileSync('.github/workflows/network-resilience.yml','utf8'),/'tests\/\*\*'/));
