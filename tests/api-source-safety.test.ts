import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const privilegedSuperadminFiles = new Set(['superadmin.ts', '_superadmin.ts']);
for (const file of fs.readdirSync('api', {recursive:true}).filter((x) => typeof x === 'string' && x.endsWith('.ts'))) {
  if (privilegedSuperadminFiles.has(String(file))) continue;
  test(`api/${file} does not reference service role`, () => {
    const source = fs.readFileSync(`api/${file}`, 'utf8');
    assert.doesNotMatch(source, /service[_-]?role/i);
  });
}

test('privileged superadmin boundary is authenticated and explicitly allowlisted', () => {
  const source = fs.readFileSync('api/_superadmin.ts', 'utf8');
  assert.match(source, /auth\.getUser\(token\)/);
  assert.match(source, /SUPERADMIN_EMAILS/);
  assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/);
});
