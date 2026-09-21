import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gateway diagnostic endpoint is uncached',()=>{ const endpoint=fs.readFileSync('api/storefront-config.ts','utf8'); const http=fs.readFileSync('api/_http.ts','utf8'); assert.match(endpoint,/sendJson\(res, 200/); assert.match(http,/no-store/); });
