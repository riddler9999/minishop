import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('rate limiter uses forwarded client address when present',()=>assert.match(fs.readFileSync('api/_rate-limit.ts','utf8'),/x-forwarded-for/));
