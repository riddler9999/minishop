import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout config URL-encodes slug',()=>assert.match(fs.readFileSync('src/features/checkout/api.ts','utf8'),/encodeURIComponent\(slug\)/));
