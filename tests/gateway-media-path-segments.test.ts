import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media endpoint requires path after bucket',()=>assert.match(fs.readFileSync('api/storefront/[...path].ts','utf8'),/parts\.length === 0/));
