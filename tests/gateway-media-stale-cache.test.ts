import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media cache permits stale responses for one week',()=>assert.match(fs.readFileSync('api/storefront/[...path].ts','utf8'),/stale-while-revalidate=604800/));
