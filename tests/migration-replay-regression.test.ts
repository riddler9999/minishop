import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const sql = fs.readFileSync('supabase/migrations/0007_production_hardening.sql', 'utf8');
const prepare = fs.readFileSync('tests/prepare-database-runtime.mjs', 'utf8');
const workflow = fs.readFileSync('.github/workflows/database-runtime-integration.yml', 'utf8');

test('historical 0007 stays immutable while disposable CI uses a temporary replay guard', () => {
  assert.match(sql, /^revoke all on function public\.rls_auto_enable\(\) from public, anon, authenticated;$/m);
  assert.doesNotMatch(sql, /to_regprocedure\('public\.rls_auto_enable\(\)'\)/);

  assert.match(prepare, /fs\.mkdtempSync/);
  assert.match(prepare, /fs\.cpSync\('supabase', runtimeSupabase/);
  assert.match(prepare, /to_regprocedure\('public\.rls_auto_enable\(\)'\)/);
  assert.match(workflow, /node tests\/prepare-database-runtime\.mjs/);
  assert.match(workflow, /supabase db reset --workdir "\$RUNTIME_WORKDIR"/);
});
