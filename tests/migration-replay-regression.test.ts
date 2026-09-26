import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const sql = fs.readFileSync('supabase/migrations/0007_production_hardening.sql', 'utf8');

test('0007 only revokes rls_auto_enable when the historical function exists', () => {
  assert.match(sql, /to_regprocedure\('public\.rls_auto_enable\(\)'\)/);
  assert.match(sql, /execute 'revoke all on function public\.rls_auto_enable\(\) from public, anon, authenticated'/);
  assert.doesNotMatch(sql, /^revoke all on function public\.rls_auto_enable\(\)/m);
});
