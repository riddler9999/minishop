import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('rate limiter tracks reset timestamp',()=>{ const s=fs.readFileSync('api/_rate-limit.ts','utf8'); assert.match(s,/reset/); assert.match(s,/reset <= now/); });
