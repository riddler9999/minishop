import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function filesUnder(root: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(root, {withFileTypes: true})) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(full));
    else out.push(full);
  }
  return out;
}

test('migration files have unique contiguous numeric prefixes in application order', () => {
  const files = fs
    .readdirSync('supabase/migrations')
    .filter((name) => name.endsWith('.sql'))
    .sort();

  const prefixes = files.map((name) => Number(name.slice(0, 4)));
  assert.equal(new Set(prefixes).size, prefixes.length, 'duplicate migration prefix');

  prefixes.forEach((prefix, index) => {
    assert.equal(prefix, index + 1, `expected migration ${String(index + 1).padStart(4, '0')}`);
  });
});

test('browser source never references a service-role credential', () => {
  for (const file of filesUnder('src').filter((name) => /\.(ts|tsx|js|jsx)$/.test(name))) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|VITE_[A-Z0-9_]*SERVICE_ROLE/i, file);
  }
});

test('committed environment templates do not target Production Supabase', () => {
  const template = fs.readFileSync('.env.example', 'utf8');
  assert.doesNotMatch(template, /fsxdnmnycizjkgstokze/i);
  assert.doesNotMatch(template, /VITE_[A-Z0-9_]*SERVICE_ROLE/i);
});

test('canonical production runbooks exist', () => {
  for (const file of [
    'docs/production/ENVIRONMENT-MATRIX.md',
    'docs/production/MIGRATION-RUNBOOK.md',
    'docs/production/RELEASE-CHECKLIST.md',
    'docs/production/ROLLBACK-RUNBOOK.md',
    'docs/production/PHASE-1-REPORT.md',
  ]) {
    assert.equal(fs.existsSync(file), true, file);
  }
});
