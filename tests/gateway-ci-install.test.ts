import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

test('network CI uses the correct install mode for repository lockfile state', () => {
  const workflow = fs.readFileSync('.github/workflows/network-resilience.yml', 'utf8');
  const tracked = execFileSync('git', ['ls-files', 'package-lock.json'], {encoding: 'utf8'}).trim();
  if (tracked) assert.match(workflow, /npm ci/);
  else assert.match(workflow, /npm install --no-audit --no-fund/);
});
