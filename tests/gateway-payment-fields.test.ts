import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout payment query selects only public fields',()=>assert.match(fs.readFileSync('api/checkout.ts','utf8'),/select\('provider,account_name,phone'\)/));
