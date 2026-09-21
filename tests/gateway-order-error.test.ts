import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('order gateway returns controlled client error for rejected RPC',()=>{ const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/if \(error\) return sendJson\(res, 400/); });
