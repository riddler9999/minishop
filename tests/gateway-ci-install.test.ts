import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('network CI uses the correct install mode for repository lockfile state', () => {
  const workflow = fs.readFileSync('.github/workflows/network-resilience.yml', 'utf8');
  if (fs.existsSync('package-lock.json')) assert.match(workflow, /npm ci/);
  else assert.match(workflow, /npm install --no-audit --no-fund/);
});
