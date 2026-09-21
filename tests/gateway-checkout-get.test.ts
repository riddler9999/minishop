import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('buyer checkout config uses first-party endpoint',()=>assert.match(fs.readFileSync('src/features/checkout/api.ts','utf8'),/fetch\(`\/api\/checkout\?slug=/));
