import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('rate limiter defaults to one-minute window',()=>assert.match(fs.readFileSync('api/_rate-limit.ts','utf8'),/60_000/));
