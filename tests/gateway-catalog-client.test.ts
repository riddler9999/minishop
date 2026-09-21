import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('catalog client uses first-party endpoint',()=>assert.match(fs.readFileSync('src/features/catalog/api/storefront.ts','utf8'),/fetch\(`\/api\/storefront\?/));
