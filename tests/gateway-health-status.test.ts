import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('health endpoint has 200 healthy and 503 degraded paths',()=>{ const s=fs.readFileSync('api/health.ts','utf8'); assert.match(s,/sendJson\(res, 200/); assert.match(s,/sendJson\(res, 503/); });
