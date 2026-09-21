import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('catalog API caps requested page size at 100',()=>assert.match(fs.readFileSync('api/storefront.ts','utf8'),/Math\.min\(limitRaw, 100\)/));
