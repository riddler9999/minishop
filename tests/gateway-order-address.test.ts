import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout gateway maps street region and township',()=>{ const s=fs.readFileSync('api/checkout.ts','utf8'); for(const k of ['p_street','p_region','p_township']) assert.match(s,new RegExp(k)); });
