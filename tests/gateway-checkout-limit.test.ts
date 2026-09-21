import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout allows at most ten requests per warm-instance window',()=>assert.match(fs.readFileSync('api/checkout.ts','utf8'),/rateLimit\(req, 10\)/));
