import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {McpError} from '../api/mcp/errors.ts';
import {createShopProfileService} from '../api/mcp/shop-profile.ts';

function fakeClient() {
  let row:any={id:'shop-a',name:'Mini A',phone:'099',logo_url:null,default_delivery_fee:2500,origin_region:'Yangon',origin_township:'Kyeemyindaing',delivery_service:'manual',slug:'mini-a',owner_id:'seller-a',plan:'starter',is_active:true};
  return {
    state:()=>row,
    client:{
      from(table:string){
        assert.equal(table,'shops');
        return {
          select(){return this;},
          eq(column:string,value:string){assert.equal(column,'id');assert.equal(value,'shop-a');return this;},
          async maybeSingle(){return {data:row,error:null};},
          update(patch:any){row={...row,...patch};return this;},
        };
      }
    } as any
  };
}

describe('MCP shop profile',()=>{
  it('reads only own storefront-facing profile',async()=>{
    const f=fakeClient(); const svc=createShopProfileService(f.client,{userId:'seller-a',shopId:'shop-a',capabilities:new Set()});
    const r=await svc.getShopProfile();
    assert.equal(r.shop.name,'Mini A');
    assert.equal('plan' in r.shop,false);
    assert.equal('owner_id' in r.shop,false);
  });
  it('updates whitelisted fields only',async()=>{
    const f=fakeClient(); const svc=createShopProfileService(f.client,{userId:'seller-a',shopId:'shop-a',capabilities:new Set()});
    await svc.updateShopProfile({name:'Renamed',logoUrl:'https://cdn/logo.png',defaultDeliveryFee:3000});
    assert.equal(f.state().name,'Renamed'); assert.equal(f.state().logo_url,'https://cdn/logo.png'); assert.equal(f.state().default_delivery_fee,3000);
  });
  it('rejects privileged/account/payment/subscription fields',async()=>{
    const f=fakeClient(); const svc=createShopProfileService(f.client,{userId:'seller-a',shopId:'shop-a',capabilities:new Set()});
    for(const bad of [{plan:'business'},{owner_id:'x'},{slug:'x'},{is_active:false},{subscription:'x'},{payment_method:'x'},{admin:true}]){
      await assert.rejects(svc.updateShopProfile(bad as any),(e:unknown)=>e instanceof McpError && e.code==='INSUFFICIENT_SCOPE');
    }
  });
});
