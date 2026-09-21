import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('catalog gateway preserves category filter',()=>assert.match(fs.readFileSync('api/storefront.ts','utf8'),/eq\('category', String\(req\.query\.category\)\)/));
