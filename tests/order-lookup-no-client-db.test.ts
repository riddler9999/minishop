import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public order lookup contains no direct RPC call',()=>{ const s=fs.readFileSync('src/features/orders/api/storefront.ts','utf8'); assert.doesNotMatch(s,/\.rpc\(/); });
