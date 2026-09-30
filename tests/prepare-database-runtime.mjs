import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

// Migration 0007 has already been applied and is immutable. A clean local
// Supabase image does not contain the historical hosted-only helper it revokes,
// so the disposable runtime uses a temporary migration copy with a replay-only
// existence guard. The repository migration and Production remain untouched.
const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'minishop-db-runtime-'));
const runtimeProjectId = `minishop-runtime-${process.env.GITHUB_RUN_ID ?? process.pid}-${process.env.GITHUB_RUN_ATTEMPT ?? '1'}`
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, '-')
  .slice(0, 60);
const runtimeWorkdir = path.join(runtimeRoot, runtimeProjectId);
const runtimeSupabase = path.join(runtimeWorkdir, 'supabase');
fs.mkdirSync(runtimeWorkdir, {recursive: true});
fs.cpSync('supabase', runtimeSupabase, {recursive: true});

const migrationPath = path.join(
  runtimeSupabase,
  'migrations',
  '0007_production_hardening.sql',
);
const source = fs.readFileSync(migrationPath, 'utf8');
const historicalStatement =
  'revoke all on function public.rls_auto_enable() from public, anon, authenticated;';
const occurrences = source.split(historicalStatement).length - 1;
assert.equal(occurrences, 1, 'historical 0007 replay statement changed unexpectedly');

const localReplayGuard = `do $local_replay$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$local_replay$;`;

fs.writeFileSync(
  migrationPath,
  source.replace(historicalStatement, localReplayGuard),
  'utf8',
);

process.stdout.write(runtimeWorkdir);
