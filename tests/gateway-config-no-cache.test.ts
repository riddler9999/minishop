import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gateway diagnostic endpoint is uncached',()=>assert.match(fs.readFileSync('api/storefront-config.ts','utf8'),/no-store/));
