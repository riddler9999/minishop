import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('/api/version exposes only safe deployment metadata', () => {
  const source = fs.readFileSync('api/version.ts', 'utf8');

  assert.match(source, /app:\s*'minishop'/);
  assert.match(source, /VERCEL_GIT_COMMIT_SHA/);
  assert.match(source, /VERCEL_TARGET_ENV/);
  assert.match(source, /VERCEL_DEPLOYMENT_ID/);
  assert.doesNotMatch(source, /SUPABASE|SERVICE_ROLE|ANON_KEY|SECRET|TOKEN/);
});
