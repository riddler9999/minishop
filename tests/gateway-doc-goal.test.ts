import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('architecture docs explain reduced independent routing paths',()=>assert.match(fs.readFileSync('api/NETWORK_RESILIENCE.md','utf8'),/reduces the number of independent DNS\/routing paths/));
