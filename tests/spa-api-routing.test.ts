import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Vercel SPA rewrite excludes API and static assets', () => {
  const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert.equal(config.rewrites[0].source, '/((?!api/|assets/).*)');
});
