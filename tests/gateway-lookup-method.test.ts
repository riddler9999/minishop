import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('order lookup gateway is GET only',()=>assert.match(fs.readFileSync('api/storefront-orders.ts','utf8'),/if \(req\.method !== 'GET'\)/));
