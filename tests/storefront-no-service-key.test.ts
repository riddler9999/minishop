import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public gateway handlers never reference privileged key names directly',()=>{
  for(const f of ['api/storefront.ts','api/checkout.ts','api/storefront-orders.ts','api/health.ts']) {
    assert.doesNotMatch(fs.readFileSync(f,'utf8'),/service.?role|secret.?key/i);
  }
});

test('lookup privilege is isolated to the fixed-purpose server helper',()=>{
  const helper=fs.readFileSync('server/_storefront-lookup-backend.ts','utf8');
  assert.match(helper,/SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(helper,/\.rpc\('lookup_order'/);
  assert.doesNotMatch(helper,/\.from\(/);
});
