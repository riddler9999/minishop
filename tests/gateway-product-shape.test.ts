import test from 'node:test';
import assert from 'node:assert/strict';
import {mapProductRow} from '../api/_map.ts';

test('gateway product mapper preserves expected camelCase shape',()=>{ const p=mapProductRow({id:'1',item_code:'A',name:'N',category:'C',color:'R',size:'M',price:5,promo_price:4,is_promotion:true,stock:2,status:'active',images:[],description:'D',arrival_date:'2026-01-01',created_at:'2026-01-01'}); assert.equal(p.itemCode,'A'); assert.equal(p.promoPrice,4); assert.equal(p.isPromotion,true); assert.equal(p.arrivalDate,'2026-01-01'); });
