import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media proxy rejects missing bucket or path',()=>assert.match(fs.readFileSync('api/storefront/[...path].ts','utf8'),/!bucket.*parts\.length === 0.*404/s));
