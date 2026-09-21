import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway maps tenant slug',()=>assert.match(fs.readFileSync('api/checkout.ts','utf8'),/p_shop_slug: b\.slug/));
