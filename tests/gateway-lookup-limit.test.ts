import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('lookup allows at most twenty requests per warm-instance window',()=>assert.match(fs.readFileSync('api/storefront-orders.ts','utf8'),/rateLimit\(req, 20\)/));
