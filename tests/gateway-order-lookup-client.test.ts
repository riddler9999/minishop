import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('buyer order lookup uses first-party endpoint',()=>assert.match(fs.readFileSync('src/features/orders/api/storefront.ts','utf8'),/fetch\(`\/api\/storefront-orders\?/));
