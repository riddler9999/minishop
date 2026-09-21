import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media proxy targets public storage object endpoint only',()=>assert.match(fs.readFileSync('api/storefront/[...path].ts','utf8'),/storage\/v1\/object\/public/));
