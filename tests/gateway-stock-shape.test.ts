import test from 'node:test';
import assert from 'node:assert/strict';
import {mapProductRow} from '../api/_map.ts';

const row={id:'1',item_code:null,name:'N',category:null,color:null,size:null,price:1,promo_price:null,is_promotion:false,status:'active',images:[],description:'',arrival_date:null,created_at:'x'};
test('inStock derives from positive stock',()=>{ assert.equal(mapProductRow({...row,stock:1}).inStock,true); assert.equal(mapProductRow({...row,stock:0}).inStock,false); });
