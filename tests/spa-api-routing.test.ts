import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Vercel SPA rewrite excludes API and static assets', () => {
  const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const spaRewrite = config.rewrites.find((rewrite: {source?: string}) => rewrite.source === '/((?!api/|assets/).*)');
  assert.ok(spaRewrite);
  assert.equal(spaRewrite.destination, '/index.html');
});
