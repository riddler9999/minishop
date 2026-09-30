import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public storefront gateway has no admin proxy',()=>{
  const publicGatewayFiles=['storefront.ts','checkout.ts','storefront-orders.ts','health.ts'];
  assert.equal(publicGatewayFiles.some((f)=>/admin/i.test(f)),false);
});

test('the only admin API is the authenticated superadmin boundary',()=>{
  const files=fs.readdirSync('api',{recursive:true}).map(String).filter((f)=>/admin/i.test(f)).sort();
  assert.deepEqual(files,['_superadmin.ts','superadmin.ts']);
  const auth=fs.readFileSync('api/_superadmin.ts','utf8');
  assert.match(auth,/auth\.getUser\(token\)/);
  assert.match(auth,/SUPERADMIN_EMAILS/);
});
