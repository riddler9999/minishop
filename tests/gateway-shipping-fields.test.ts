import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout shipping query selects region township and fee only',()=>assert.match(fs.readFileSync('api/checkout.ts','utf8'),/select\('region,township,fee'\)/));
