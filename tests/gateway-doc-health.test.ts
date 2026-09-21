import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gateway README documents health endpoint',()=>assert.match(fs.readFileSync('api/README.md','utf8'),/\/api\/health/));
