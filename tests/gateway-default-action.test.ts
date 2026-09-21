import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('storefront gateway defaults action to shop',()=>assert.match(fs.readFileSync('api/storefront.ts','utf8'),/req\.query\?\.action \|\| 'shop'/));
