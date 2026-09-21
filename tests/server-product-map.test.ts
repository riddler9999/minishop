import test from 'node:test';
import assert from 'node:assert/strict';
import {mapProductRow} from '../api/_map.ts';

test('server mapper returns domain product and same-origin media', () => {
  const p = mapProductRow({id:'1',item_code:'A',name:'X',category:null,color:null,size:null,price:100,promo_price:null,is_promotion:false,stock:1,status:'active',images:['https://x.supabase.co/storage/v1/object/public/product-images/s/p.webp'],description:'',arrival_date:null,created_at:'2026-01-01'});
  assert.equal(p.itemCode, 'A');
  assert.equal(p.image, '/api/storefront/product-images/s/p.webp');
  assert.equal(p.inStock, true);
});
