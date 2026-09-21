import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('health endpoint is uncached',()=>{ const endpoint=fs.readFileSync('api/health.ts','utf8'); const http=fs.readFileSync('api/_http.ts','utf8'); assert.match(endpoint,/sendJson\(res/); assert.match(http,/no-store/); });
