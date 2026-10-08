import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('package-lock.json is valid npm lockfile JSON', async () => {
  const lockfile = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8')) as {
    lockfileVersion?: number;
    packages?: Record<string, unknown>;
  };

  assert.equal(lockfile.lockfileVersion, 3);
  assert.ok(lockfile.packages?.[''], 'lockfile must include the root package');
});
