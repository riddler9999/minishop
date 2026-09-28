import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {createMcpHandler} from '../api/mcp.ts';
import {authenticateSeller,type AuthDeps} from '../api/mcp/auth.ts';
import {createRateLimiter} from '../api/mcp/rate-limit.ts';
import {createDefaultStoreDesign} from '../src/domain/storeDesign/index.ts';
import type {StoreDesignLifecyclePort} from '../api/mcp/store-design.ts';

describe('MiniShop MCP endpoint E2E lifecycle',()=>{
  it('authenticates Seller A, lists/calls tools, publishes Draft, and rolls back buyer state',async()=>{
    let draft=createDefaultStoreDesign('clean-minimal');
    let published=createDefaultStoreDesign('soft-elegant');
    let previousPublished=createDefaultStoreDesign('street-bold');
    let draftRevision=1,publishedRevision=1;
    const adapter:StoreDesignLifecyclePort={
      async loadOwnStoreDesign(){return{draft,published,previousPublished,draftRevision,publishedRevision,updatedAt:null,publishedAt:null};},
      async saveDraft({expectedRevision,document}){assert.equal(expectedRevision,draftRevision);draft=document;draftRevision++;return{revision:draftRevision,document:draft};},
      async publishDraft({expectedDraftRevision}){assert.equal(expectedDraftRevision,draftRevision);previousPublished=published;published=draft;publishedRevision++;return{draft,published,previousPublished,draftRevision,publishedRevision,updatedAt:null,publishedAt:null};},
      async rollbackPublished({expectedPublishedRevision}){assert.equal(expectedPublishedRevision,publishedRevision);const current=published;published=previousPublished;previousPublished=current;publishedRevision++;return{draft,published,previousPublished,draftRevision,publishedRevision,updatedAt:null,publishedAt:null};},
    };
    const profile={id:'shop-a',name:'Seller A Shop',phone:'099',logo_url:null,default_delivery_fee:2000,origin_region:'Yangon',origin_township:'Kamayut',delivery_service:'manual'};
    const sellerClient:any={from(table:string){
      let column='',value='';
      return {select(){return this;},eq(key:string,next:unknown){column=key;value=String(next);return this;},async maybeSingle(){
        if(table!=='shops'||(column==='owner_id'&&value!=='seller-a')||(column==='id'&&value!=='shop-a'))return{data:null,error:null};
        return{data:column==='owner_id'?{id:'shop-a'}:profile,error:null};
      }};
    }};
    const authDeps:AuthDeps={
      createAuthClient:()=>({auth:{async getUser(token:string){return token==='seller-a-token'?{data:{user:{id:'seller-a'}},error:null}:{data:{user:null},error:new Error('invalid token')};}}} as any),
      createSellerClient:()=>sellerClient,
      capabilitiesForUser:async()=>new Set(['store:read','store:write','store:publish','profile:read'] as const),
    };
    const auditEntries:any[]=[];
    const handler=createMcpHandler({
      authenticate:(req)=>authenticateSeller(req,authDeps),
      createStoreAdapter:()=>adapter,
      createAuditSink:()=>({async record(entry){auditEntries.push(entry);}}),
      rateLimiter:createRateLimiter({max:100,windowMs:60_000}),
    });
    async function request(body:unknown,token='seller-a-token'){
      const res:any={headers:{} as Record<string,string>,setHeader(key:string,value:string){this.headers[key]=value;},end(value:string){this.body=value;}};
      await handler({method:'POST',headers:{authorization:`Bearer ${token}`},body},res);
      return{status:res.statusCode,body:JSON.parse(res.body)};
    }

    const initialized=await request({jsonrpc:'2.0',id:1,method:'initialize'});
    assert.equal(initialized.body.result.protocolVersion,'2025-06-18');
    const listed=await request({jsonrpc:'2.0',id:2,method:'tools/list'});
    assert.equal(listed.body.result.tools.length,18);
    const profileRead=await request({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'get_shop_profile',arguments:{}}});
    assert.equal(profileRead.body.result.structuredContent.shop.name,'Seller A Shop');
    const designRead=await request({jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'get_store_design',arguments:{}}});
    assert.equal(designRead.body.result.structuredContent.published.themeId,'soft-elegant');
    const themeUpdate=await request({jsonrpc:'2.0',id:5,method:'tools/call',params:{name:'update_store_theme',arguments:{themeId:'dark-modern'}}});
    assert.equal(themeUpdate.body.result.structuredContent.changed,true);
    const sectionAdd=await request({jsonrpc:'2.0',id:6,method:'tools/call',params:{name:'add_store_section',arguments:{template:'home',type:'rich-text'}}});
    assert.equal(sectionAdd.body.result.structuredContent.changed,true);
    const publish=await request({jsonrpc:'2.0',id:7,method:'tools/call',params:{name:'publish_store',arguments:{}}});
    assert.equal(publish.body.result.structuredContent.publishedRevision,2);
    assert.equal(published.themeId,'dark-modern');
    assert.ok(published.templates.home.sections.some((section)=>section.type==='rich-text'));
    const rollback=await request({jsonrpc:'2.0',id:8,method:'tools/call',params:{name:'rollback_store_design',arguments:{}}});
    assert.equal(rollback.body.result.structuredContent.publishedRevision,3);
    assert.equal(published.themeId,'soft-elegant');
    assert.equal(auditEntries.length,4);

    const unauthenticated=await request({jsonrpc:'2.0',id:9,method:'tools/call',params:{name:'get_store_design',arguments:{}}},'expired');
    assert.equal(unauthenticated.status,401);
    assert.equal(unauthenticated.body.error.data.code,'TOKEN_EXPIRED');
    const malformed=await request({jsonrpc:'2.0',id:10,method:'tools/call',params:{name:'get_product',arguments:{id:42}}});
    assert.equal(malformed.status,400);
    assert.equal(malformed.body.error.data.code,'INVALID_ARGUMENTS');
    const spoofed=await request({jsonrpc:'2.0',id:11,method:'tools/call',params:{name:'get_store_design',arguments:{shop_id:'shop-b'}}});
    assert.equal(spoofed.status,403);
    assert.equal(spoofed.body.error.data.code,'INSUFFICIENT_SCOPE');
  });
});
