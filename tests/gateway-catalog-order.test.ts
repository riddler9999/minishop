import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('catalog keeps newest arrival ordering',()=>assert.match(fs.readFileSync('api/storefront.ts','utf8'),/order\('arrival_date', \{ascending: false, nullsFirst: false\}\)/));
