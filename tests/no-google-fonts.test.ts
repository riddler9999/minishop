import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('runtime shell does not depend on Google Fonts', () => {
  const index = fs.readFileSync('index.html', 'utf8');
  const vercel = fs.readFileSync('vercel.json', 'utf8');
  assert.doesNotMatch(index, /fonts\.googleapis|fonts\.gstatic/);
  assert.doesNotMatch(vercel, /fonts\.googleapis|fonts\.gstatic/);
});
