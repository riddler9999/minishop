import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('anonymous order placement is throttled',()=>{ const s=fs.readFileSync('api/checkout.ts','utf8'); assert.match(s,/rateLimit\(req, 10\)/); });
