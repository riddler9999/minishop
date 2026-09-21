import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public catalog edge cache TTL stays short',()=>assert.match(fs.readFileSync('api/storefront.ts','utf8'),/s-maxage=30/));
