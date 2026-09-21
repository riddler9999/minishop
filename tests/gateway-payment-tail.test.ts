import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public merchant account shape preserves empty tail field',()=>assert.match(fs.readFileSync('api/checkout.ts','utf8'),/tail:''/));
