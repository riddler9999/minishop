import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public media edge cache TTL is one day',()=>assert.match(fs.readFileSync('api/storefront/[...path].ts','utf8'),/s-maxage=86400/));
