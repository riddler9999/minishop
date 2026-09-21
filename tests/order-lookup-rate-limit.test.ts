import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public order lookup is throttled',()=>{ const s=fs.readFileSync('api/storefront-orders.ts','utf8'); assert.match(s,/rateLimit\(req, 20\)/); });
