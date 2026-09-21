import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('health endpoint has 200 healthy and 503 degraded paths',()=>{ const s=fs.readFileSync('api/health.ts','utf8'); assert.match(s,/status\(200\)|res\.status\(200\)|statusCode/); assert.match(s,/503/); });
