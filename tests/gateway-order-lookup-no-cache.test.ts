import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('lookup gateway explicitly disables public cache',()=>assert.match(fs.readFileSync('api/storefront-orders.ts','utf8'),/\{order: data\}, false/));
