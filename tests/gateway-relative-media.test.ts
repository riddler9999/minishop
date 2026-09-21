import test from 'node:test';
import assert from 'node:assert/strict';
import {mapProductRow} from '../api/_map.ts';

test('server mapper returns same-origin media',()=>{ const p=mapProductRow({id:'1',item_code:null,name:'x',category:null,color:null,size:null,price:1,promo_price:null,is_promotion:false,stock:0,status:'active',images:['https://x.supabase.co/storage/v1/object/public/product-images/a/b.webp'],description:'',arrival_date:null,created_at:'x'}); assert.ok(p.images[0].startsWith('/api/')); });
