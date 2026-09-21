import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('browser media cache TTL is one hour',()=>assert.match(fs.readFileSync('api/storefront/[...path].ts','utf8'),/max-age=3600/));
