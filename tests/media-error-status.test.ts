import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('media proxy propagates upstream non-success status',()=>assert.match(fs.readFileSync('api/storefront/[...path].ts','utf8'),/res\.status\(upstream\.status\)\.end\(\)/));
