import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout shop query selects pricing and delivery configuration fields',()=>{
  const s=fs.readFileSync('api/checkout.ts','utf8');
  assert.match(s,/select\('id,default_delivery_fee,delivery_service,origin_region,origin_township'\)/);
});
