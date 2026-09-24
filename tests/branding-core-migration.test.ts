import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  'supabase/migrations/0020_branding_core_all_plans.sql',
  'utf8',
);

test('branding migration preserves platform-managed owner and plan guards', () => {
  assert.match(sql, /owner_is_platform_managed/);
  assert.match(sql, /plan_is_platform_managed/);
});

test('branding migration removes the Business-only logo guard', () => {
  assert.doesNotMatch(sql, /new\.logo_url is distinct from old\.logo_url/);
  assert.doesNotMatch(sql, /business_plan_required/);
});
