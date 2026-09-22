import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const api=readFileSync(new URL('../api/superadmin.ts',import.meta.url),'utf8');
const auth=readFileSync(new URL('../api/_superadmin.ts',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/app/App.tsx',import.meta.url),'utf8');

test('superadmin API verifies a real Supabase user and an explicit owner allowlist',()=>{
  assert.match(auth,/auth\.getUser\(token\)/);
  assert.match(auth,/SUPERADMIN_EMAILS/);
  assert.match(auth,/SUPABASE_SERVICE_ROLE_KEY/);
});
test('service-role RPCs stay server-side',()=>{
  assert.match(api,/admin_activate_subscription/);
  assert.match(api,/admin_credit_order_pack/);
  assert.doesNotMatch(app,/SERVICE_ROLE/);
});
