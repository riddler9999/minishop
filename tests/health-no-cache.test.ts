import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('health endpoint is uncached',()=>assert.match(fs.readFileSync('api/health.ts','utf8'),/no-store/));
