import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('catalog cache permits five minutes stale revalidation',()=>assert.match(fs.readFileSync('api/storefront.ts','utf8'),/stale-while-revalidate=300/));
