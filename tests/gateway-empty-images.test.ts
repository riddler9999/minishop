import test from 'node:test';
import assert from 'node:assert/strict';
import {mapProductRow} from '../api/_map.ts';

test('product with no images maps image to null',()=>{ const p=mapProductRow({id:'1',item_code:null,name:'N',category:null,color:null,size:null,price:1,promo_price:null,is_promotion:false,stock:0,status:'active',images:[],description:'',arrival_date:null,created_at:'x'}); assert.deepEqual(p.images,[]); assert.equal(p.image,null); });
