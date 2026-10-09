import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const privilegedServerFiles = new Set(['superadmin.ts', '_superadmin.ts', '_storefront-lookup-backend.ts', 'notifications.ts', 'ai.ts']);
for (const file of fs.readdirSync('api', {recursive:true}).filter((x) => typeof x === 'string' && x.endsWith('.ts'))) {
  if (privilegedServerFiles.has(String(file))) continue;
  test(`api/${file} does not reference service role`, () => {
    const source = fs.readFileSync(`api/${file}`, 'utf8');
    assert.doesNotMatch(source, /service[_-]?role/i);
  });
}

test('privileged AI boundary authenticates seller before using service credentials', () => {
  const source = fs.readFileSync('api/ai.ts', 'utf8');
  assert.match(source, /authenticateSeller\(req\)/);
  assert.match(source, /context\.shopId/);
  assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/);
});

test('privileged superadmin boundary is authenticated and explicitly allowlisted', () => {
  const source = fs.readFileSync('api/_superadmin.ts', 'utf8');
  assert.match(source, /auth\.getUser\(token\)/);
  assert.match(source, /SUPERADMIN_EMAILS/);
  assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/);
});


test('privileged storefront lookup backend is fixed-purpose and cannot proxy arbitrary queries', () => {
  const source = fs.readFileSync('api/_storefront-lookup-backend.ts', 'utf8');
  assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(source, /\.rpc\('lookup_order'/);
  assert.doesNotMatch(source, /\.from\(/);
  assert.doesNotMatch(source, /auth\.admin|auth\.getUser/);
});
