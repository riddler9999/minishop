import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('gateway preserves place_order and lookup_order RPC names',()=>{ assert.match(fs.readFileSync('api/checkout.ts','utf8'),/rpc\('place_order'/); assert.match(fs.readFileSync('api/storefront-orders.ts','utf8'),/rpc\('lookup_order'/); });
