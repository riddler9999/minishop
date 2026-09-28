import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('lookup gateway maps slug order number and phone to the fixed-purpose RPC backend',()=>{
  const gateway=fs.readFileSync('api/storefront-orders.ts','utf8');
  const backend=fs.readFileSync('api/_storefront-lookup-backend.ts','utf8');
  assert.match(gateway,/slug,\s*orderNo,\s*phone,/s);
  for(const key of ['p_shop_slug: args.slug','p_order_no: args.orderNo','p_phone: args.phone']) {
    assert.match(backend,new RegExp(key));
  }
});
