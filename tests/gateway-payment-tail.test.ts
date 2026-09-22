import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public merchant account shape preserves empty tail field', () => {
  const s = fs.readFileSync('api/checkout.ts', 'utf8');
  assert.match(s, /tail:\s*''/);
});
