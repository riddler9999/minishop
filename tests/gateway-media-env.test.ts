import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media proxy rejects requests without backend origin env',()=>assert.match(fs.readFileSync('api/storefront/[...path].ts','utf8'),/!base.*404/s));
